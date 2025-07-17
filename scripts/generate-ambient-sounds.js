const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Ambient sound configurations
const AMBIENT_SOUNDS = {
  'rain': {
    type: 'pink',
    duration: 300, // 5 minutes
    description: 'Rain ambience'
  },
  'forest': {
    type: 'brown',
    duration: 300,
    description: 'Forest ambience'
  },
  'ocean': {
    type: 'white',
    duration: 300,
    description: 'Ocean waves'
  },
  'cafe': {
    type: 'pink',
    duration: 300,
    description: 'Cafe background'
  },
  'fireplace': {
    type: 'brown',
    duration: 300,
    description: 'Fireplace crackling'
  },
  'white-noise': {
    type: 'white',
    duration: 300,
    description: 'White noise'
  }
};

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
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

function generateAmbientSound(category, config) {
  const filename = `${category}_loop.mp3`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  console.log(`🎵 Generating ${config.description}...`);
  
  try {
    // Create ambient sound using FFmpeg with proper syntax
    const command = `ffmpeg -f lavfi -i "anoisesrc=d=${config.duration}:c=${config.type}:r=44100" -acodec libmp3lame -ab 128k -y "${filepath}"`;
    
    execSync(command, { stdio: 'pipe' });
    
    // Check if file was created and has size
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Generated ${filename} (${sizeMB}MB)`);
      return true;
    } else {
      console.log(`❌ Failed to generate ${filename}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error generating ${category}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🎵 Ambient Sound Generator');
  console.log('==========================');
  
  ensureDir(OUTPUT_DIR);
  
  let successCount = 0;
  const totalSounds = Object.keys(AMBIENT_SOUNDS).length;
  
  for (const [category, config] of Object.entries(AMBIENT_SOUNDS)) {
    console.log(`\n📥 Processing ${category}...`);
    const success = generateAmbientSound(category, config);
    if (success) successCount++;
    
    // Small delay between generations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Generation Summary:`);
  console.log(`✅ Successful: ${successCount}/${totalSounds}`);
  
  if (successCount > 0) {
    console.log('\n🎵 Ambient sounds generated successfully!');
    console.log('Files are ready in:', OUTPUT_DIR);
  } else {
    console.log('\n❌ No sounds were generated. Please check FFmpeg installation.');
  }
}

// Example usage of Firestore utilities
async function firestoreDemo() {
  const testUserId = 'demo-user';
  const testStats = [
    { id: 'stat1', duration: 25, completed: true, createdAt: new Date().toISOString() },
    { id: 'stat2', duration: 15, completed: false, createdAt: new Date().toISOString() }
  ];

  // Save focus session stats
  await saveUserData(testUserId, 'focusSessionStats', testStats);
  console.log('Saved test focus session stats to Firestore');

  // Retrieve focus session stats
  const loadedStats = await getUserData(testUserId, 'focusSessionStats');
  console.log('Loaded focus session stats from Firestore:', loadedStats);

  // Delete focus session stats
  await deleteUserData(testUserId, 'focusSessionStats');
  console.log('Deleted test focus session stats from Firestore');
}

// Uncomment to run the demo
// firestoreDemo();

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