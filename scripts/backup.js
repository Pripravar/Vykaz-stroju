// Noční záloha Firestore -> JSON soubor (spouští GitHub Actions).
// Projde všechny kolekce i podkolekce (např. zaznamy/{id}/poznamky).
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(svc) });
const db = admin.firestore();

async function dumpCollection(ref){
  const snap = await ref.get();
  const out = {};
  for(const doc of snap.docs){
    const entry = { data: doc.data() };
    const subcols = await doc.ref.listCollections();
    if(subcols.length){
      entry.__subcollections = {};
      for(const sc of subcols){ entry.__subcollections[sc.id] = await dumpCollection(sc); }
    }
    out[doc.id] = entry;
  }
  return out;
}

(async () => {
  const cols = await db.listCollections();
  const backup = { exportedAt: new Date().toISOString(), collections: {} };
  for(const c of cols){ backup.collections[c.id] = await dumpCollection(c); }
  const date = new Date().toISOString().slice(0,10);
  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `backup-${date}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 2));
  console.log('Záloha uložena:', file, '| kolekce:', Object.keys(backup.collections).join(', '));
})().catch(e => { console.error(e); process.exit(1); });
