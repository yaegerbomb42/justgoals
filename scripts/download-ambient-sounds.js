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

// Direct MP3 links from various sources
const AMBIENT_SOUNDS = {
  'rain': [
    'https://www.soundjay.com/misc/sounds/rain-01.mp3',
    'https://www.soundjay.com/misc/sounds/rain-02.mp3',
    'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-84567/zapsplat-nature-rain-heavy-outside-84567.mp3'
  ],
  'forest': [
    'https://www.soundjay.com/misc/sounds/forest-01.mp3',
    'https://www.soundjay.com/misc/sounds/forest-02.mp3',
    'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-84567/zapsplat-nature-forest-ambience-84567.mp3'
  ],
  'ocean': [
    'https://www.soundjay.com/misc/sounds/ocean-01.mp3',
    'https://www.soundjay.com/misc/sounds/ocean-02.mp3',
    'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-84567/zapsplat-nature-ocean-waves-84567.mp3'
  ],
  'cafe': [
    'https://www.soundjay.com/misc/sounds/cafe-01.mp3',
    'https://www.soundjay.com/misc/sounds/cafe-02.mp3',
    'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-84567/zapsplat-ambience-cafe-background-84567.mp3'
  ],
  'fireplace': [
    'https://www.soundjay.com/misc/sounds/fire-01.mp3',
    'https://www.soundjay.com/misc/sounds/fire-02.mp3',
    'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-84567/zapsplat-ambience-fireplace-crackling-84567.mp3'
  ],
  'white-noise': [
    'https://www.soundjay.com/misc/sounds/white-noise-01.mp3',
    'https://www.soundjay.com/misc/sounds/white-noise-02.mp3',
    'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-84567/zapsplat-ambience-white-noise-84567.mp3'
  ]
};

// Alternative: Free ambient sound URLs (these are examples, you may need to find working ones)
const FREE_AMBIENT_URLS = {
  'rain': [
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2dde668d05.mp3?filename=rain-and-thunder-140610.mp3',
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0b1355c098.mp3?filename=rain-01-39735.mp3'
  ],
  'forest': [
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8b7c8b8b8b.mp3?filename=forest-ambience-140610.mp3',
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_1b1355c098.mp3?filename=forest-01-39735.mp3'
  ],
  'ocean': [
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_9b7c8b8b8b.mp3?filename=ocean-waves-140610.mp3',
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_2b1355c098.mp3?filename=ocean-01-39735.mp3'
  ],
  'cafe': [
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_0b7c8b8b8b.mp3?filename=cafe-ambience-140610.mp3',
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_3b1355c098.mp3?filename=cafe-01-39735.mp3'
  ],
  'fireplace': [
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1b7c8b8b8b.mp3?filename=fireplace-140610.mp3',
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_4b1355c098.mp3?filename=fireplace-01-39735.mp3'
  ],
  'white-noise': [
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b7c8b8b8b.mp3?filename=white-noise-140610.mp3',
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_5b1355c098.mp3?filename=white-noise-01-39735.mp3'
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    const file = fs.createWriteStream(dest);
    
    const request = https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (totalSize) {
          const progress = ((downloaded / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${progress}%`);
        }
      });
      
      response.pipe(file);
      file.on('finish', () => {
        process.stdout.write('\n');
        file.close(resolve);
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function tryDownloadUrls(urls, category, index) {
  for (let i = 0; i < urls.length; i++) {
    try {
      const url = urls[i];
      const filename = `${category}_${index + 1}.mp3`;
      const filepath = path.join(OUTPUT_DIR, filename);
      
      await downloadFile(url, filepath);
      console.log(`✅ Successfully downloaded: ${filename}`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to download from URL ${i + 1}: ${error.message}`);
      if (i === urls.length - 1) {
        console.log(`❌ All URLs failed for ${category}`);
        return false;
      }
    }
  }
  return false;
}

async function createPlaceholderSounds() {
  console.log('\n🎵 Creating placeholder ambient sound files...');
  
  // Create simple placeholder MP3 files using ffmpeg
  const { execSync } = require('child_process');
  
  for (const [category, urls] of Object.entries(FREE_AMBIENT_URLS)) {
    try {
      const filename = `${category}_loop.mp3`;
      const filepath = path.join(OUTPUT_DIR, filename);
      
      // Create a simple 5-minute ambient sound using ffmpeg
      const command = `ffmpeg -f lavfi -i "anoisesrc=d=300:c=pink[out]" -map "[out]" -y "${filepath}"`;
      
      console.log(`Creating placeholder for ${category}...`);
      execSync(command, { stdio: 'pipe' });
      console.log(`✅ Created placeholder: ${filename}`);
      
    } catch (error) {
      console.log(`❌ Failed to create placeholder for ${category}: ${error.message}`);
    }
  }
}

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

// Example usage of Firestore utilities
async function firestoreDemo() {
  const testUserId = 'demo-user';
  const testMilestones = [
    { id: 'milestone1', title: 'Test Milestone 1', createdAt: new Date().toISOString() },
    { id: 'milestone2', title: 'Test Milestone 2', createdAt: new Date().toISOString() }
  ];

  // Save milestones
  await saveUserData(testUserId, 'milestones', testMilestones);
  console.log('Saved test milestones to Firestore');

  // Retrieve milestones
  const loadedMilestones = await getUserData(testUserId, 'milestones');
  console.log('Loaded milestones from Firestore:', loadedMilestones);

  // Delete milestones
  await deleteUserData(testUserId, 'milestones');
  console.log('Deleted test milestones from Firestore');
}

// Uncomment to run the demo
// firestoreDemo();

async function main() {
  console.log('🎵 Ambient Sound Downloader');
  console.log('============================');
  
  ensureDir(OUTPUT_DIR);
  
  let successCount = 0;
  const totalCategories = Object.keys(FREE_AMBIENT_URLS).length;
  
  // Try downloading from free sources first
  for (const [category, urls] of Object.entries(FREE_AMBIENT_URLS)) {
    console.log(`\n📥 Processing ${category}...`);
    const success = await tryDownloadUrls(urls, category, 0);
    if (success) successCount++;
    
    // Wait a bit between downloads to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 Download Summary:`);
  console.log(`✅ Successful: ${successCount}/${totalCategories}`);
  
  if (successCount === 0) {
    console.log('\n⚠️  No downloads succeeded. Creating placeholder sounds...');
    await createPlaceholderSounds();
  }
  
  console.log('\n🎵 Done! Check the sounds directory for downloaded files.');
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

main().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
}); 