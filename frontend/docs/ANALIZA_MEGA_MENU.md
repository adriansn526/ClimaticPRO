# Analiză Meniuri & Filtre (Mega Menu / Mobile Menu)

Am analizat codul sursă pentru a înțelege cum sunt populate secțiunile de filtre din meniu (BTU, Clasa Energetică, Top Brands).

## 1. Cum funcționează implementarea curentă

Filtrele sunt calculate Server-Side în `app/[locale]/layout.tsx` și transmise către componentele `Header`, `MegaMenu` și `MobileMegaMenu`.

### A. Filtrele BTU și Clasa Energetică
Logica se află în funcția `getUsedAttributeSlugs` din `lib/woocommerce.ts`.
1. **Fetch Produse**: Se descarcă primele **500 de produse** din categoriile "Rezidențial" sau "Comercial".
2. **Scanare**: Se iterează prin fiecare produs și se colectează atributele utilizate:
   - Pentru **BTU**: Caută atributele care conțin "capacitate", "pa_capacitate" sau "btu".
   - Pentru **Energie**: Caută atributele care conțin "clasa" și "energ".
3. **Filtrare Globală**: Lista rezultată este intersectată cu lista globală de termeni (`allPaCapacitate`, `allPaClasaEnergie`) pentru a afișa doar termenii valizi.

### B. Top Brands
Logica se află în funcția `getAllBrands` din `lib/woocommerce.ts`.
1. **Fetch Global**: Se descarcă primele **50 producătorii** (`pa_brand`) globali care au produse (`hideEmpty: true`).
2. **Afișare**: În `MegaMenu.tsx`, se afișează primii 8 din această listă.
3. **Problemă Identificată**: Lista **NU este sortată după numărul de produse**. GraphQL returnează implicit alfabetic. Asta înseamnă că "Top Branduri" afișează de fapt "Primele 8 branduri în ordine alfabetică" (ex: Daikin, Gree...), nu neapărat cele mai populare.

---

## 2. Propuneri de Îmbunătățiri

### A. Sortare Reală "Top Brands"
**Problemă**: În prezent, secțiunea "Top Branduri" nu afișează brandurile cu cele mai multe produse, ci primele alfabetice.
**Soluție**: Modificarea query-ului GraphQL în `getAllBrands` pentru a sorta după numărul de produse.

```typescript
// În lib/woocommerce.ts
allPaBrand(first: 50, where: { hideEmpty: true, orderby: COUNT, order: DESC }) { ... }
```

### B. Branduri Relevante per Categorie (Rezidențial vs Comercial)
**Problemă**: Lista de branduri este globală. E posibil să apară un brand în meniul "Rezidențial" care vinde doar echipamente "Comerciale".
**Soluție**: Extinderea funcției `getUsedAttributeSlugs` pentru a colecta și brandurile întâlnite în cele 500 de produse scanate. Astfel, meniul "Rezidențial" va arăta doar brandurile care au efectiv produse rezidențiale.

### C. Optimizare Performanță & Acuratețe
**Problemă**: Scanarea a 500 de produse la fiecare request (chiar dacă e cache-uit) este "heavy". De asemenea, dacă există 600 de produse, atributele unice de la produsul 501+ nu vor apărea în filtre.
**Soluție**:
1. **Creștere limită**: Dacă catalogul crește, limita de 500 ar trebui mărită.
2. **Sortare Produse Scanate**: Pentru a maximiza șansa de a prinde brandurile/atributele populare, ar trebui să scanăm produsele cele mai bine vândute (`orderby: { field: TOTAL_SALES, order: DESC }`) în loc de cele mai noi.

### D. Mobile Menu - UX
**Observație**: Pe mobil, navigarea e un "Drill-down".
**Soluție**: Dacă un utilizator selectează "Rezidențial", i se prezintă subcategoriile + o listă lungă de filtre (BTU, Energie, Brand). Ar fi util ca primele opțiuni să fie cele mai populare (deja sortăm top brands, dar și BTU-urile uzuale ar putea fi primele - ex: 9000 și 12000 BTU).

---

## Plan de Acțiune (Imediat)

Dacă ești de acord, pot aplica imediat următoarele corecții:

1. [ ] **Fix Top Brands**: Adăugare `orderby: COUNT` în `getAllBrands`.
2. [ ] **Contextual Brands**: Extragerea brandurilor din scanarea produselor pentru a avea "Top Branduri Rezidențiale" vs "Top Branduri Comerciale".
3. [ ] **Sortare Scanare**: Scanarea celor mai vândute produse pentru a popula filtrele, garantând că filtrele relevante pentru produsele populare apar primele.
