import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { uploadPhotos, useSignedUrls } from "@/lib/owner";
import { Button } from "@/components/ui/button";

export function PhotoStrip({ paths, size = "h-12 w-16" }: { paths: string[]; size?: string }) {
  const urls = useSignedUrls(paths.slice(0, 3));
  if (!paths.length) return <div className={`${size} rounded-lg bg-muted`} aria-label="No photo" />;
  return (
    <div className="flex gap-1">
      {paths
        .slice(0, 3)
        .map((p) =>
          urls.data?.[p] ? (
            <img key={p} src={urls.data[p]} alt="" className={`${size} rounded-lg object-cover`} />
          ) : (
            <div key={p} className={`${size} animate-pulse rounded-lg bg-muted`} />
          ),
        )}
    </div>
  );
}

export function PhotoManager({
  userId,
  paths,
  onChange,
  onBusyChange,
}: {
  userId: string;
  paths: string[];
  onChange: (p: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const urls = useSignedUrls(paths);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      onChange([...paths, ...(await uploadPhotos(userId, files))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  // Removal changes draft metadata only. Cancel must not delete saved photos.
  const remove = (p: string) => {
    onChange(paths.filter((x) => x !== p));
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {paths.map((p) => (
          <div key={p} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
            {urls.data?.[p] && (
              <img src={urls.data[p]} alt="Listing photo" className="h-full w-full object-cover" />
            )}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={busy}
              onClick={() => remove(p)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 bg-card/90 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs text-muted-foreground hover:bg-muted">
          <ImagePlus className="h-6 w-6" />
          {busy ? "Uploading…" : "Add photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
