# Deploy con Supabase e Vercel

## 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Nella **SQL Editor** del dashboard, esegui lo script in `supabase/schema.sql` per creare le tabelle `fish` e `app_config`.
3. In **Project Settings → API** copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 2. Variabili d'ambiente (locale)

Copia `.env.example` in `.env` e compila:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Vercel

1. Collega il repo su [vercel.com](https://vercel.com) e avvia il deploy.
2. In **Project → Settings → Environment Variables** aggiungi le stesse variabili:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Rideploya se le variabili sono state aggiunte dopo il primo deploy.

Senza queste variabili l’app usa il **localStorage** (nessun Supabase); con le variabili i dati sono persistenti su Supabase.
