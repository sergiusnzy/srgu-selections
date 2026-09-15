# ACORD — Vercel-ready

Proiect static, fără build step.

## Deploy
1. În Vercel: Add New → Project → Import repository.
2. Alege `sergiusnzy/srgu-selections`.
3. Framework Preset: Other.
4. Build Command: lasă gol.
5. Output Directory: lasă gol.
6. Deploy.

## Ce am schimbat
- separat HTML / CSS / JS;
- reparat bug-ul de Shuffle;
- îmbunătățit UX mobil și desktop;
- adăugat `prefers-reduced-motion`;
- URL-urile reclamei sunt validate;
- eliminată executarea de HTML/JavaScript din reclame și din playlisturile importate;
- payload-ul share conține doar date, nu cod executabil;
- UI Admin mai simplu;
- adăugate headere de securitate pentru Vercel.

## Limitare importantă
Admin-ul acestei versiuni rămâne `localStorage`, deci modificările făcute din Admin sunt locale browserului/dispozitivului.

Pentru un Admin adevărat, comun tuturor vizitatorilor, următorul pas este conectarea la o bază de date precum Supabase și folosirea autentificării reale.
