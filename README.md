# Desetidenka strojů (v0.2)

Mobilní webová aplikace (PWA) pro rychlé vyplňování **desetidenního výkazu o práci stavebního stroje**. Strojník se přihlásí svým jménem, vybere stroj na daný den a zapíše stav počítadla – jeden den do **15 sekund**. Data tečou do **cloudu (Firebase, projekt `vykazy-stroju`)**, takže vedoucí mechanizace vidí vše živě.

## Hlavní vlastnosti

- **Přihlášení jménem** – strojník jen klikne na své jméno ze seznamu (volitelný PIN). Žádná hesla, žádné SMS.
- **Stroj se vybírá pro daný den** – ze společného číselníku, nebo se napíše ručně (našeptávač). Strojníci nemají stálý stroj.
- **Rychlý zápis dne** – stavba · stav počítadla · tankování ano/ne (hodiny od–do nepovinně). Motohodiny (Mth) se **dopočítají z rozdílu počítadla**.
- **„Jako včera"** – jedním tlačítkem předvyplní včerejší den, stačí změnit počítadlo.
- **Našeptávač staveb** – učí se ze zadaných akcí (napíšeš „Marti" → nabídne „Martinovice").
- **Vidět autora** – u každého záznamu je vidět, kdo ho zapsal.
- **Nepřepsatelnost** – záznam je klíčovaný `strojník__stroj__den`. Cizí záznam nikdo nepřepíše; oprava = **nový samostatný záznam** (appka na konflikt upozorní). Mazat smí jen autor nebo administrátor.
- **Připomínky k záznamu** – ke **kterémukoli** záznamu může **kdokoli** přidat připomínku (podepsanou jménem), aniž by měnil data záznamu. Cizí připomínku smaže jen její autor nebo admin.
- **Přehled / desetidenka pro vedoucího** – filtry (stroj, stavba, strojník, období) + **součty motohodin po stavbách** + export CSV a tisk/PDF.
- **Funguje offline** (PWA) a sám se po připojení synchronizuje.

### Motohodiny – jak se počítají

Počítadlo motohodin je na stroji, takže **kontinuita je per STROJ, ne per strojník**:

```
Mth(den) = stav počítadla(dnes) − stav počítadla(poslední dřívější zápis téhož stroje)
```

Když stroj řídil jiný den jiný člověk, appka stejně najde poslední stav stroje od kohokoli. První zápis stroje má Mth = 0. Když počítadlo klesne, appka upozorní (překlep / výměna).

---

## Firebase je už nastavený

Projekt **`vykazy-stroju`** (Spark plán) má hotovo: registrovanou web aplikaci (config je v `index.html`), zapnuté **Anonymous** přihlášení, **Firestore** databázi (region eur3) a publikovaná **pravidla** (viz níže). Není potřeba nic dalšího – stačí appku nasadit.

### Firestore Rules (aktuálně publikované)

Záznam smí upravit/smazat jen jeho autor nebo administrátor. Číselníky a stavy počítadel vidí všichni přihlášení (nutné pro výpočet Mth a přehled vedoucího). Připomínky může přidat kdokoli, ale cizí nepřepíše. Admina pravidla poznají přes pomocnou kolekci `uids` (mapuje zařízení → strojníka), kterou appka plní sama.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn(){ return request.auth != null; }
    function myStrojnikId(){
      return get(/databases/$(database)/documents/uids/$(request.auth.uid)).data.strojnikId;
    }
    function isAdmin(){
      return signedIn()
        && exists(/databases/$(database)/documents/uids/$(request.auth.uid))
        && get(/databases/$(database)/documents/strojnici/$(myStrojnikId())).data.role == 'admin';
    }

    match /uids/{uid} {
      allow read:  if signedIn();
      allow write: if signedIn() && uid == request.auth.uid;
    }
    match /strojnici/{id} { allow read, write: if signedIn(); }
    match /stroje/{id}    { allow read, write: if signedIn(); }
    match /stavby/{id}    { allow read, write: if signedIn(); }

    match /zaznamy/{id} {
      allow read:   if signedIn();
      allow create: if signedIn() && request.resource.data.ownerUid == request.auth.uid;
      allow update: if signedIn() && (resource.data.ownerUid == request.auth.uid || isAdmin());
      allow delete: if signedIn() && (resource.data.ownerUid == request.auth.uid || isAdmin());

      // Připomínky – přidat smí kdokoli, smazat/upravit jen autor připomínky nebo admin.
      match /poznamky/{pid} {
        allow read:   if signedIn();
        allow create: if signedIn() && request.resource.data.autorUid == request.auth.uid;
        allow update, delete: if signedIn() && (resource.data.autorUid == request.auth.uid || isAdmin());
      }
    }
  }
}
```

---

## První spuštění

1. Otevři appku v telefonu.
2. Není-li ještě žádný strojník, appka vyzve k vytvoření prvního jména → ten se stane **správcem (vedoucí)** ★.
3. Vedoucí v **Číselníky** přidá stroje, stavby a ostatní strojníky.
4. Strojníci se přihlásí výběrem svého jména.

## Datový model (Firestore)

| Kolekce | Co obsahuje |
|---------|-------------|
| `strojnici` | jméno, role (`strojnik`/`admin`), `claimedUid` (zařízení), `pinHash` |
| `uids` | mapování `auth.uid` → `strojnikId` (pro rozpoznání admina v pravidlech) |
| `stroje` | číselník: název, typ, SPZ, `lastMoto` (cache počítadla) |
| `stavby` | číselník: kód, název |
| `zaznamy` | **jeden den**: `${strojník}__${stroj}__${datum}` → datum, stroj, strojník, stavba, `stavCitadla`, `mth`, hodiny, tankování |
| `zaznamy/{id}/poznamky` | připomínky k záznamu (text, autor, čas) |

## Spuštění lokálně

```bash
cd Vykaz-stroju
python3 -m http.server 8000
# http://localhost:8000
```

## Nasazení (GitHub Pages)

Čistě statické. *Settings → Pages → Source = main, /(root)*. Po pár minutách běží na `https://pripravar.github.io/Vykaz-stroju/`.

## Co může přijít dál

- Automatický e-mail vedoucímu dopravy s reportem desetidenky (~2 dny po dekádě).
- Export úředního Excelu „Výkaz stavebního stroje" (šablona v `sablona/`).
- Fotky dokladů (tankování, počítadlo) přes Firebase Storage.

## Licence

Interní nástroj M-SILNICE a.s. Nepouštět dál bez svolení.
