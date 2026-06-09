# Noční záloha dat (Firestore)

Každou noc se automaticky uloží kompletní záloha databáze (strojníci, stroje, stavby, výkazy i připomínky) přes **GitHub Actions**. Záloha se ukládá jako **artifact** (neveřejný soubor u běhu Actions), který se drží 90 dní – **necommituje se do repa**, protože repo je veřejné a data obsahují jména a hodiny lidí.

## Jednorázové nastavení (~3 minuty)

Potřeba je jednou vložit do GitHubu „servisní klíč", aby měl GitHub právo číst databázi:

1. **Vytvoř servisní klíč** ve Firebase:
   - Firebase konzole → ⚙ **Project settings → Service accounts**
   - **Generate new private key** → stáhne se soubor `*.json`.
2. **Vlož klíč jako tajný klíč do GitHubu:**
   - GitHub repo `Pripravar/Vykaz-stroju` → **Settings → Secrets and variables → Actions → New repository secret**
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Secret:** vlož celý obsah staženého `*.json` souboru → **Add secret**.

Hotovo. Od té chvíle běží záloha každou noc sama.

> Klíč nikam jinam nedávej a needituj ho do kódu – patří jen do GitHub Secrets.

## Jak zálohu stáhnout / obnovit

- **Stáhnout:** GitHub repo → karta **Actions** → workflow **Noční záloha Firestore** → vyber běh → dole **Artifacts** → stáhni `firestore-zaloha-…` (ZIP s JSON souborem).
- **Spustit zálohu ručně:** Actions → Noční záloha Firestore → **Run workflow**.
- **Obnova:** JSON obsahuje všechny dokumenty po kolekcích (vč. podkolekce `poznamky`). Obnovu (nahrání zpět do Firestore) udělá jednoduchý skript – řekni a připravím ho, až bude potřeba.

## Co se zálohuje

Všechny kolekce: `strojnici`, `uids`, `stroje`, `stavby`, `zaznamy` a u každého záznamu i podkolekce `poznamky`.

## Poznámky

- Artifact se drží **90 dní**. Pokud chceš delší/trvalou historii, lze místo artifactu posílat zálohu do soukromého repa nebo na e-mail – řekni a doplním.
- Záloha běží na serveru GitHubu (cron `0 0 * * *` = 00:00 UTC). Běh je zdarma v rámci GitHub Actions.
