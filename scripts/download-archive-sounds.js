const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Firebase Admin SDK is initialized below for backend access to Firebase services.
// See README.md for details on usage and security.
const admin = require('firebase-admin');
const serviceAccount = require('../goals-d50ab-firebase-adminsdk-fbsvc-4f737e36b3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // databaseURL: 'https://goals-d50ab.firebaseio.com'
  });
  // You can now use admin.firestore(), admin.auth(), etc. in this script
  console.log('Firebase Admin initialized');
}

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'sounds');
const CATEGORIES = ['rain', 'forest', 'ocean', 'cafe', 'fireplace', 'white noise'];
const FILES_PER_CATEGORY = 2;

// --- Firestore Utility Functions ---
const db = admin.firestore();

function getUserCollection(userId, collection) {
  return db.collection('users').doc(userId).collection(collection);
}

async function saveUserData(userId, collection, data) {
  // data should be an array of objects with unique 'id' fields
  const batch = db.batch();
  const colRef = getUserCollection(userId, collection);
  data.forEach(item => {
    const docRef = colRef.doc(item.id.toString());
    batch.set(docRef, item);
  });
  await batch.commit();
}

async function getUserData(userId, collection) {
  const colRef = getUserCollection(userId, collection);
  const snapshot = await colRef.get();
  return snapshot.docs.map(doc => doc.data());
}

async function deleteUserData(userId, collection) {
  const colRef = getUserCollection(userId, collection);
  const snapshot = await colRef.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function getMp3LinksFromArchiveOrg(query) {
  const searchUrl = `https://archive.org/search.php?query=${encodeURIComponent(query)}&and[]=mediatype%3A%22audio%22`;
  const res = await fetch(searchUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  const links = [];
  $('.item-ia').each((i, el) => {
    const pageUrl = 'https://archive.org' + $(el).find('.C234 a').attr('href');
    links.push(pageUrl);
  });
  return links.slice(0, FILES_PER_CATEGORY);
}

async function getFirstMp3FromPage(pageUrl) {
  const res = await fetch(pageUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  let mp3Url = null;
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.endsWith('.mp3') && href.startsWith('https://')) {
      mp3Url = href;
      return false;
    }
  });
  return mp3Url;
}

async function main() {
  ensureDir(OUTPUT_DIR);
  for (const category of CATEGORIES) {
    const catDir = path.join(OUTPUT_DIR, category.replace(/ /g, '-'));
    ensureDir(catDir);
    console.log(`Searching Archive.org for "${category}"...`);
    const pageLinks = await getMp3LinksFromArchiveOrg(category + ' ambience');
    let count = 0;
    for (const pageUrl of pageLinks) {
      const mp3Url = await getFirstMp3FromPage(pageUrl);
      if (mp3Url) {
        const filename = path.join(catDir, `archive_${category.replace(/ /g, '-')}_${count + 1}.mp3`);
        console.log(`Downloading: ${mp3Url} -> ${filename}`);
        try {
          await downloadFile(mp3Url, filename);
          count++;
        } catch (e) {
          console.error(`Failed to download ${mp3Url}: ${e.message}`);
        }
      }
      if (count >= FILES_PER_CATEGORY) break;
    }
    if (count === 0) {
      console.log(`No MP3s found for ${category}`);
    }
  }
  console.log('Done!');
}

// Example usage of Firestore utilities
async function firestoreDemo() {
  const testUserId = 'demo-user';
  const testEntries = [
    { id: 'entry1', title: 'Test Journal Entry 1', content: 'Content 1', createdAt: new Date().toISOString() },
    { id: 'entry2', title: 'Test Journal Entry 2', content: 'Content 2', createdAt: new Date().toISOString() }
  ];

  // Save journal entries
  await saveUserData(testUserId, 'journalEntries', testEntries);
  console.log('Saved test journal entries to Firestore');

  // Retrieve journal entries
  const loadedEntries = await getUserData(testUserId, 'journalEntries');
  console.log('Loaded journal entries from Firestore:', loadedEntries);

  // Delete journal entries
  await deleteUserData(testUserId, 'journalEntries');
  console.log('Deleted test journal entries from Firestore');
}

// Uncomment to run the demo
// firestoreDemo();

main(); 