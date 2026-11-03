# Šta kaže Srbija? — MVP 0.1

## Sadržaj
- `index.html` — mobilni web prototip.
- `config.js` — podešavanja Supabase-a (unesi URL i anon/publishable key).
- `schema.sql` — tabele, RLS pravila i RPC funkcije za anonimno glasanje i zbirne rezultate.

## Demo režim
Bez podešene baze, igra radi u demo režimu. Glasovi se čuvaju samo u lokalnom browseru i nisu zajednički. Procenti su ilustrativni, ne stvarni podaci.

## Povezivanje baze
1. Napravi Supabase projekat.
2. Izvrši `schema.sql` u SQL Editor-u.
3. U Table Editor-u proveri tri početna pitanja i odgovore.
4. Objavi prvo pitanje: `update public.questions set status='published',publish_at=now() where slug='pozajmica';`
5. U `config.js` unesi Project URL i anon/publishable key. Nikada ne stavljaj service_role/secret key u frontend.
6. Objavi `index.html` i `config.js` na GitHub Pages, Netlify ili Cloudflare Pages.

## Ograničenja i zaštita
- Jedan glas po browser identifikatoru i pitanju; nije otporan na botove ili više uređaja.
- Sirovi redovi glasova nisu javno dostupni; javni su samo rezultati kroz RPC.
- Pre javnog lansiranja dodati politiku privatnosti, podatke o vlasniku/kontaktu, proveru pravne osnove i rokova čuvanja podataka. Ako se uvede analitika ili marketing kolačići, posebno obraditi obaveštenje/saglasnost.
- Rezultati su glasovi korisnika igre, a ne reprezentativno istraživanje javnog mnjenja.
- Sponzorisana pitanja moraju biti jasno označena.

## Monetizacija — test, ne garancija
Prvi proizvod za prodaju je jasno označeno sponzorisano pitanje. Predlog pilot cene za razgovor sa malim lokalnim brendom: 100–150 EUR, uz dogovoreni obim i izveštaj. To je naša test cena, ne proveren tržišni prosek.

## Prvih 7 dana
1. Povezati Supabase i testirati glasanje na dva uređaja.
2. Objaviti jedno pitanje dnevno.
3. Distribuirati kroz lične profile, lokalne FB grupe i kratke Reels/TikTok objave.
4. Meriti posete, glasove, deljenja i povratke.
5. Kontaktirati 10 potencijalnih sponzora i ponuditi pilot kampanju.
