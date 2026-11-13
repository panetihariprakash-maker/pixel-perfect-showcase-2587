CREATE OR REPLACE FUNCTION public.validate_guest_booking() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE d jsonb; ci date; co date; g int; n int; cap int; rate int; BEGIN
 d:=new.details;
 IF d->>'guestId' IS DISTINCT FROM new.user_id::text THEN RAISE EXCEPTION 'Booking owner mismatch'; END IF;
 IF d->>'payment' IS DISTINCT FROM 'Payment Ready/Test' THEN RAISE EXCEPTION 'Live payment is not enabled'; END IF;
 IF TG_OP='UPDATE' THEN IF (d-'status') IS DISTINCT FROM (old.details-'status') OR d->>'status' IS DISTINCT FROM 'Cancelled' OR new.user_id IS DISTINCT FROM old.user_id OR new.id IS DISTINCT FROM old.id THEN RAISE EXCEPTION 'Only request cancellation is allowed'; END IF; new.created_at:=old.created_at; RETURN new; END IF;
 IF jsonb_typeof(d) IS DISTINCT FROM 'object' OR d->>'id' IS DISTINCT FROM new.id OR d->>'status' IS DISTINCT FROM 'Pending' THEN RAISE EXCEPTION 'Invalid pending booking'; END IF;
 IF coalesce(d->>'roomId','') NOT IN ('deluxe-valley','family-suite','forest-treehouse','infinity-pool-villa') THEN RAISE EXCEPTION 'Unknown demonstration room'; END IF;
 cap:=CASE d->>'roomId' WHEN 'family-suite' THEN 5 WHEN 'infinity-pool-villa' THEN 4 ELSE 2 END; rate:=CASE d->>'roomId' WHEN 'deluxe-valley' THEN 8500 WHEN 'family-suite' THEN 14500 WHEN 'forest-treehouse' THEN 11000 ELSE 24000 END;
 IF coalesce(d->>'checkIn','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(d->>'checkOut','') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Invalid booking dates'; END IF;
 ci:=(d->>'checkIn')::date; co:=(d->>'checkOut')::date; n:=co-ci;
 IF ci<current_date OR n<=0 THEN RAISE EXCEPTION 'Check-out must follow a current or future check-in'; END IF;
 IF jsonb_typeof(d->'guests') IS DISTINCT FROM 'number' OR (d->>'guests') !~ '^\d+$' THEN RAISE EXCEPTION 'Invalid guest count'; END IF; g:=(d->>'guests')::int;
 IF g<1 OR g>cap THEN RAISE EXCEPTION 'Guest count exceeds room capacity'; END IF;
 IF jsonb_typeof(d->'nights') IS DISTINCT FROM 'number' OR coalesce((d->>'nights')::numeric,-1)<>n OR jsonb_typeof(d->'total') IS DISTINCT FROM 'number' OR coalesce((d->>'total')::numeric,-1)<>n*rate THEN RAISE EXCEPTION 'Booking amount or nights mismatch'; END IF;
 IF length(btrim(coalesce(d->>'guestName','')))<2 OR length(d->>'guestName')>200 OR coalesce(d->>'email','') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' OR coalesce(d->>'phone','') !~ '^\+?[0-9][0-9\s()-]{7,19}$' THEN RAISE EXCEPTION 'Invalid guest contact details'; END IF;
 new.created_at:=now(); RETURN new; END $$;
CREATE OR REPLACE FUNCTION public.validate_guest_state_shape() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF jsonb_typeof(new.plans) IS DISTINCT FROM 'array' OR jsonb_typeof(new.enquiries) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Plans and enquiries must be arrays'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(new.plans) item WHERE jsonb_typeof(item) IS DISTINCT FROM 'object' OR coalesce(item->>'id','')='' OR coalesce(item->>'activityId','')='' OR coalesce(item->>'date','')='') OR EXISTS(SELECT 1 FROM jsonb_array_elements(new.enquiries) item WHERE jsonb_typeof(item) IS DISTINCT FROM 'object' OR coalesce(item->>'id','')='' OR coalesce(item->>'name','')='' OR coalesce(item->>'topic','')='') THEN RAISE EXCEPTION 'Invalid saved plan or enquiry'; END IF; RETURN new; END $$;
CREATE TRIGGER validate_guest_state_shape BEFORE INSERT OR UPDATE ON public.guest_state FOR EACH ROW EXECUTE FUNCTION public.validate_guest_state_shape(); REVOKE ALL ON FUNCTION public.validate_guest_state_shape() FROM PUBLIC,anon,authenticated;