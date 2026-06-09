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

Projekt **`vykazy-stroju`**: web aplikace (config v `index.html`), **Firestore** (region eur3), **Google přihlášení** (auth gate) a níže uvedená pravidla. Doporučeno navíc zapnout **App Check** (reCAPTCHA) a v `index.html` doplnit `RECAPTCHA_SITE_KEY`.

> **Identita = Google účet.** Přihlášení ověří Google → nikdo se nevydává za jiného. `signedIn()` v pravidlech = ověřený Google uživatel (ne anonym). Strojník doc je klíčovaný Google `uid`.

### Co zapnout v konzoli (jednorázově)

1. **Authentication → Sign-in method → Google → Enable** (zadat support e-mail).
2. **Authentication → Settings → Authorized domains** → přidat `pripravar.github.io`.
3. **App Check** → registrovat web app s **reCAPTCHA v3**, site key vložit do `RECAPTCHA_SITE_KEY` v `index.html`, pak App Check **Enforce** pro Firestore.

### Firestore Rules (Google přihlášení)

Admin = e-mail allowlist (Ondřej) **nebo** kolekce `admins/{uid}` (spravuje admin) — **nejde zfalšovat**. Nikdo si nenastaví roli admina. Číselníky a záznamy čtou jen přihlášení Googlem; mazání strojníků/strojů/staveb jen admin.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Přihlášený = ověřený účet (Google/telefon). Anonymní tokeny odmítnout.
    function signedIn(){
      return request.auth != null
             && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
    function isAdmin(){
      return signedIn() && (request.auth.token.email == 'arasid33@gmail.com'
             || exists(/databases/$(database)/documents/admins/$(request.auth.uid)));
    }

    match /admins/{uid} { allow read: if signedIn(); allow write: if isAdmin(); }

    match /strojnici/{id} {
      allow read:   if signedIn();
      allow create: if signedIn() && request.resource.data.uid == request.auth.uid
                    && request.resource.data.role == 'strojnik';
      allow update: if isAdmin()
                    || (resource.data.uid == request.auth.uid
                        && request.resource.data.role == resource.data.role);
      allow delete: if isAdmin();
    }
    match /stroje/{id} { allow read: if signedIn(); allow create, update: if signedIn(); allow delete: if isAdmin(); }
    match /stavby/{id} { allow read: if signedIn(); allow create, update: if signedIn(); allow delete: if isAdmin(); }

    match /zaznamy/{id} {
      allow read:   if signedIn();
      allow create: if signedIn() && request.resource.data.ownerUid == request.auth.uid;
      allow update: if signedIn() && (resource.data.ownerUid == request.auth.uid || isAdmin());
      allow delete: if signedIn() && (resource.data.ownerUid == request.auth.uid || isAdmin());

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
