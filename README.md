# Výkaz stroje – desetidenka

Mobilní webová aplikace (PWA) pro vyplňování desetidenního výkazu o práci stavebního stroje. Výstup je Excel ve formátu „Výkaz stavebního stroje“ M-SILNICE a.s., OZ Praha – stejný tiskopis, jako se používá dnes.

## Co to umí (v0.1)

- Bez přihlašování - po otevření je hned seznam strojů
- Volitelné jméno strojníka (objeví se v Excelu jako „Řidič") - klikni na kartu „Strojník" nebo na ⚙ v záhlaví
- Vlastní katalog strojů (válec, finišer, nákladní auto, kropice, čelní nakladač, bagr, grejdr, fréza, …)
- Denní záznam: stavba, popis práce, množství, km, hodiny posádky/stroje, rozpad hodin (nezaj., opravy, údržba, přesuny, jiné), spotřeba PHM (benzin, nafta, olej)
- Přehled dekády (10 dnů) s automatickými součty
- Motohodiny – stav na zač. a konci dekády
- Export do .xlsx ve formátu „Výkaz stavebního stroje“ – jen vyplní existující tiskopis
- Funguje **offline** (PWA, service worker)
- Lze „nainstalovat" na plochu telefonu (iPhone: Sdílet → Přidat na plochu; Android: nabídka „Přidat na plochu")

## Co zatím **neumí** (přijde ve v0.2)

- Cloud (Firebase) – v0.1 ukládá data jen lokálně do telefonu (localStorage). Pokud strojník smaže prohlížeč, smaže si i data. **Pro reálný provoz je Firebase nezbytný.**
- Sdílení mezi řidičem a vedoucím mechanizace
- Digitální podpis (řidič / mistr / kontrola)
- Hromadný export pro vedoucího mechanizace (více strojů × více dekád najednou)
- Notifikace „nevyplnil jsi včerejšek"

## Jak to spustit lokálně

Stačí jakýkoli statický webserver. Nejjednodušší:

```bash
cd Vykaz-stroju
python3 -m http.server 8000
# otevřít http://localhost:8000
```

Nebo přes Node:

```bash
npx serve .
```

## Nasazení (deploy)

Aplikace je čistě statická (HTML + JS + XLSX šablona). Nasaditelná zdarma na:

- **GitHub Pages** – v nastavení repa Settings → Pages → Source = main, /(root). Po pár minutách běží na `https://pripravar.github.io/Vykaz-stroju/`.
- **Cloudflare Pages** – propojit repo, framework: žádný, build command: žádný, output dir: `.`.
- **Vercel / Netlify** – stejně.
- **Vlastní server / Firebase Hosting** (až se přidá Firebase).

## Struktura souborů

```
Vykaz-stroju/
├── index.html              # celá aplikace (UI + logika)
├── manifest.json           # PWA manifest
├── service-worker.js       # offline cache
├── sablona/
│   └── Vykaz_stavebniho_stroje_sablona.xlsx   # vzor tiskopisu, který se vyplňuje
└── README.md
```

## Roadmap

| Verze | Co přibude |
|-------|------------|
| v0.1  | Lokální PWA, formulář, export Excelu (dnes) |
| v0.2  | Firebase Auth (SMS / e-mail), Firestore = sdílená data mezi řidičem a vedoucím |
| v0.3  | Admin pro vedoucího mechanizace (web): přehled všech strojů, hromadný export, schvalovací workflow |
| v0.4  | Digitální podpis, foto dokladů (tankování, počítadlo), notifikace |
| v0.5  | API / napojení na účetní systém |

## Mapování polí aplikace → Excel

Export do `Vykaz_stavebniho_stroje_sablona.xlsx` plní tyto buňky:

| Pole | Buňka |
|------|-------|
| Měsíc / dekáda | K3 |
| Inv. číslo | N6 |
| Řidič | T6 |
| Datum (den) | A11–A20 |
| Stavba | B11–B20 |
| Popis | C11–C20 |
| Množství | D11–D20 |
| km | E11–E20 |
| Posádka od / do / hodiny | F / G / H |
| Stroj od / do / hodiny | I / J / K |
| Rozpad (nezaj./opr.stav./opr.díl./údržba/přes./jiné) | L / M / N / O / P / Q |
| PHM (benzin / nafta / mot.olej / ost.olej) | R / S / T / U |
| Součty za dekádu | řádek 21 |
| Motohodiny zač. / konec | N23 / N24 |

Pokud vedoucí mechanizace najde, že hodnoty padají do špatných buněk, stačí upravit funkci `exportXlsx()` v `index.html` – mapování je tam přehledně v jedné sekci.

## Licence

Interní nástroj M-SILNICE a.s. Nepouštět dál bez svolení.
