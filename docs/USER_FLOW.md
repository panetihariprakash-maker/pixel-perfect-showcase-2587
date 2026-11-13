# Azure Ridge user flow

The five feature areas organize existing functionality; they do not replace existing pages or navigation.

```mermaid
flowchart TD
  H[Public resort homepage] --> R[Rooms and Villas]
  H --> A[Public catalogue-grounded Gemini assistant]
  H --> I[Policies and directions]
  R --> B[Choose room and booking dates]
  B --> S{Signed in?}
  S -->|No| AU[Existing signup or signin]
  AU --> EC[Email confirmation when required]
  EC --> D[Guest Dashboard]
  S -->|Yes| DB[Save pending booking request]
  DB --> D
  D --> P[Private profile and bookings]
  D --> C[Travel planning form]
  D --> AP[Save private activity plans]
  D --> E[Save and retrieve private enquiries]
  AU --> O[Owner application]
  O --> SA[Super Admin approval]
  SA --> OP[Owner property and reservation portal]
  ST[Protected staff role] --> FD[Front desk demonstration]
  ST --> OPS[Operations demonstration]
  ADM[Protected superadmin role] --> SA
```

## Boundaries

- Home, rooms, policies and directions are public.
- Guest personal information stays behind authentication and owner-scoped RLS.
- A new account is not a staff/admin authorization. Business access requires approval.
- Catalogue assistant answers do not confirm bookings, retrieve private records or take money.
- Operational sample data is not the private guest database.
