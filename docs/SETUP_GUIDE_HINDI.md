# BizTrack setup — Hinglish guide

1. Node.js LTS, Git aur VS Code install karo.
2. ZIP extract karke BizTrack folder VS Code mein open karo.
3. Terminal: `cd frontend`
4. `npm install`
5. Supabase par project banao.
6. Supabase SQL Editor mein `supabase/migrations/0001_initial_schema.sql` run karo.
7. `frontend/.env.example` ki copy `frontend/.env.local` naam se banao.
8. `.env.local` mein Supabase URL aur anon/public key bharo.
9. `npm run dev` run karo.
10. Browser mein Vite ka local URL kholo.

Important:
- Service role key frontend mein kabhi mat daalna.
- `.env.local` GitHub par commit mat karna.
- First account ko SQL se Master Admin banane ka step README mein hai.
- Shop registration ke baad Master Admin approval aur membership active honi chahiye.
- Real shop data se pehle RLS test aur backup restore test karo.
- Items add/edit/archive/restore ka module available hai. Permanent delete history hone par database block karega.
- Purchases/Sales screen abhi safe placeholder hai; financial records ko live use se pehle atomic RPCs aur payment forms ke saath complete karna zaroori hai.
