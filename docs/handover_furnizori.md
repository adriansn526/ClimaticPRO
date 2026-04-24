# AI Handover Document - Modulul "Furnizori"

## 1. Descrierea Modulului
Modulul **Furnizori** (`/admin/furnizori`) din ClimaticPRO este un sistem avansat de PIM (Product Information Management) B2B și RPA (Scraping/Crawling) menit să aducă, să filtreze și să uniformizeze catalogul de produse B2B al platformei, preluând date din multiple surse externe (site-urile web ale furnizorilor).

Sistemul automatizează procesul prin care noile cataloage de la furnizorii de echipamente sunt aduse în sistemul intern și mapate inteligent pe ierarhia proprie de categorii și pe referințele deja existente în platformă (B2B Products).

## 2. Structura Paginiilor / Interfeței

Modulul este împărțit în trei pagini principale:

### A. Gestionare Furnizori și Configurare Bot (`/admin/furnizori/page.tsx`)
Rolul paginii: Gestiunea entităților de furnizori și a parametrilor tehnici prin care crawler-ul navighează site-urile lor.
- **Acțiuni Furnizori:** Adăugare, Editare, Ștergere a datelor companiei (Nume, CUI, Contact, etc.).
- **Global Cron:** Există un comutator ("Comutator Global Cron - Bot 24/7") care activează sau oprește Scraping-ul recurent automat la nivel global.
- **Configurare Boți Scraper (DOM Selectors):** Pentru fiecare furnizor, un admin poate seta logica de navigare a bot-ului pe site-ul țintă:
  - URL-urile de Root (Categoriile de unde începe navigarea).
  - Selectori CSS pentru paginarea produselor, prețuri, titluri de produse, stare stoc ("Badge Stoc").
  - Parametri de interceptare API avansată (ex. `customProvider: 'altex'`, `regionalStockLocation`).
- **Scraping la Cald:** Buton de declanșare manuală a scraper-ului pentru un furnizor. Folosește o funcție de polling live care interoghează endpoint-ul `/api/admin/scrapers/status` pentru a actualiza un loader UI referitor la stadiul bot-ului.

### B. Carantină Produse (`/admin/furnizori/carantina/page.tsx`)
Rolul paginii: Managementul produselor găsite pe site-urile furnizorilor, care nu se potrivesc automat (100% strict) cu produsele B2B deja existente. Oferă o suită de instrumente asistate de AI.
- **Smart PIM Importer & Deep Scrape:** Interfața permite descărcarea asincronă a detaliilor tehnice complexe și a imaginilor de la sursă direct pe loc ("🪄 Crează Produs"). Utilizează `/api/admin/suppliers/quarantine/deep-scrape`.
- **Intercepție AI Copilot (NLP):**
  - Buton "🧠 AI Predict" - Execută procesare de limbaj natural (NLP) pentru a obține brand, capacitate (BTU) și recomandări de mapare pentru categorie pe model logic.
  - Scoruri de similaritate: Produsele afișează scorul de potrivire generat la primul scrape. Interfața oferă opțiuni de selectare "Mapare în Masă" pe baza unui threshold configurabil (>95%, >90%).
- **Mapare Manuală:** Selectarea unui produs extras și legarea forțată de un produs din baza de date proprie ClimaticPRO.
- **Import Bulk:** Opțiune bulk de tip fire-and-forget, ce declanșează AI Copilot și Deep Scrape rând pe rând pentru sute de produse aflate în Quarantine queue.

### C. Dicționar Categorii B2B (`/admin/furnizori/categorii/page.tsx`)
Rolul paginii: Reprezintă memoriile bot-ului intern. Un sistem prin care termenii găsiți pe breadcrumb-urile furnizorilor (ex: *"Scule și Feronerie"*) sunt traduși (mampați) direct către slug-urile/structurile din structura oficială proprie (ex: *"Aere Condiționate"*). Odată mapate aici, importurile viitoare ale scraper-ului vor aloca automat categoria corectă.

## 3. Entități de Date și Comunicare Client-Server

Acest modul comunică cu următoarele endpoint-uri backend definite în folderul `/app/api/admin/`:
- `GET /api/admin/suppliers`
- `POST/PUT /api/admin/suppliers/[id]`
- `POST /api/admin/scrapers/run` și `GET /api/admin/scrapers/status` (Polling)
- `GET /api/admin/suppliers/quarantine` 
- `POST /api/admin/suppliers/quarantine/map` (pentru asocierea cu B2B Products)
- `POST /api/admin/suppliers/quarantine/deep-scrape`
- `POST /api/admin/suppliers/quarantine/ai-analyze`
- `POST /api/admin/suppliers/quarantine/import` (pentru convertirea unui produs din Carantină într-unul oficial de Catalog)
- `GET/POST /api/admin/suppliers/categories` (Modificare/creare de alocare lexicată)

Modele Prisma probabile pe care e bazat ecosistemul:
- `Supplier`: Date esențiale ale furnizorului inclusiv câmpurile de `crawlerConfig` de tip JSON și flag de `autoSync`.
- `UnmappedProduct` (denumit adesea și Quarantine Product): Conține detaliile scrape-ului brut (ex. `extractedName`, `extractedPrice`, `supplierProductUrl`).
- `Product` (B2B): Produsele reale de pe platformă, care au sub-tabel legat ce definește lista de `suppliers[]` ce pot onora acest produs.
- `CategoryMapping`: Legătura dintre categoriile externe și ID-urile interne.

## 4. Sugestii de Dezvoltare / Extensii Vitale pe Viitor
1. **Paginare Carantină:** Cu cât se adaugă mai mulți furnizori, carantina va conține sute de produse per scrape. Tabelul are acum un map() pe întreg array-ul `filteredProducts`. Ar fi ideal de implementat Server-Side Pagination și filtering sever side (ex: Prisma `.skip` și `.take`).
2. **WebSocket Logging:** Înlocuirea intervalelor de polling de 3 secunde din meniul root cu conexiuni WebSockets/SSEs pentru log-urile live de la Boți în cazul de timeout extrem.
3. **Export CSV:** Implementarea unei funcții rapide de Descărcare a rezultatelor din carantină înainte de o modificare bulk majoră, pentru trasabilitate/rollback.
