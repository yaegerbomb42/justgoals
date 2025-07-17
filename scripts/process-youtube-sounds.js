// Firebase Admin SDK is initialized below for backend access to Firebase services.
// See README.md for details on usage and security.
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('../goals-d50ab-firebase-adminsdk-fbsvc-4f737e36b3.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // Add databaseURL here if you use Realtime Database
    // databaseURL: 'https://goals-d50ab.firebaseio.com'
  });
  // You can now use admin.firestore(), admin.auth(), etc. in this script
  console.log('Firebase Admin initialized');
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

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'sounds');
const SOUND_CATEGORIES = {
  'rain': {
    queries: ['rain sounds', 'rain ambience', 'rain white noise'],
    fallbackUrls: [
      'https://www.youtube.com/watch?v=mPZkdNFkNps',
      'https://www.youtube.com/watch?v=8jLOx1hD3_o',
      'https://www.youtube.com/watch?v=QKuqYJhqQqY'
    ]
  },
  'forest': {
    queries: ['forest sounds', 'forest ambience', 'nature sounds'],
    fallbackUrls: [
      'https://www.youtube.com/watch?v=8jLOx1hD3_o',
      'https://www.youtube.com/watch?v=mPZkdNFkNps',
      'https://www.youtube.com/watch?v=QKuqYJhqQqY'
    ]
  },
  'ocean': {
    queries: ['ocean waves', 'ocean sounds', 'sea waves'],
    fallbackUrls: [
      'https://www.youtube.com/watch?v=QKuqYJhqQqY',
      'https://www.youtube.com/watch?v=mPZkdNFkNps',
      'https://www.youtube.com/watch?v=8jLOx1hD3_o'
    ]
  },
  'cafe': {
    queries: ['cafe ambience', 'coffee shop sounds', 'cafe background'],
    fallbackUrls: [
      'https://www.youtube.com/watch?v=mPZkdNFkNps',
      'https://www.youtube.com/watch?v=8jLOx1hD3_o',
      'https://www.youtube.com/watch?v=QKuqYJhqQqY'
    ]
  },
  'fireplace': {
    queries: ['fireplace sounds', 'fire crackling', 'fireplace ambience'],
    fallbackUrls: [
      'https://www.youtube.com/watch?v=8jLOx1hD3_o',
      'https://www.youtube.com/watch?v=mPZkdNFkNps',
      'https://www.youtube.com/watch?v=QKuqYJhqQqY'
    ]
  },
  'white-noise': {
    queries: ['white noise', 'pink noise', 'ambient noise'],
    fallbackUrls: [
      'https://www.youtube.com/watch?v=QKuqYJhqQqY',
      'https://www.youtube.com/watch?v=mPZkdNFkNps',
      'https://www.youtube.com/watch?v=8jLOx1hD3_o'
    ]
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if yt-dlp is installed
function checkYtDlp() {
  try {
    execSync('yt-dlp --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Download a single video with timeout and error handling
async function downloadVideo(url, outputPath, category) {
  return new Promise((resolve, reject) => {
    log(`Downloading: ${url}`);
    
    const args = [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--output', outputPath,
      '--no-playlist',
      '--max-downloads', '1',
      '--retries', '3',
      url
    ];

    const process = spawn('yt-dlp', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let timeout;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (!process.killed) process.kill();
    };

    timeout = setTimeout(() => {
      log(`Timeout downloading ${category}`, 'error');
      cleanup();
      reject(new Error('Download timeout'));
    }, 60000); // 60 second timeout

    process.stdout.on('data', (data) => {
      stdout += data.toString();
      if (data.toString().includes('Downloading')) {
        log(`Downloading ${category}...`);
      }
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      cleanup();
      
      if (code === 0) {
        log(`Successfully downloaded ${category}`, 'success');
        resolve(outputPath);
      } else {
        log(`Failed to download ${category}: ${stderr}`, 'error');
        reject(new Error(`Download failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      cleanup();
      log(`Process error for ${category}: ${error.message}`, 'error');
      reject(error);
    });
  });
}

// Try to download using search queries first, then fallback URLs
async function downloadWithFallback(category, config) {
  const tempDir = path.join(OUTPUT_DIR, 'temp');
  ensureDirectoryExists(tempDir);
  
  const outputPath = path.join(tempDir, `${category}_temp.mp3`);
  
  // Try search queries first
  for (const query of config.queries) {
    try {
      log(`Trying search query: "${query}" for ${category}`);
      
      // Use ytsearch with proper quoting for spaces
      const searchArgs = [
        `ytsearch1:"${query}"`,
        '--get-id',
        '--no-playlist'
      ];
      
      const videoId = execSync(`yt-dlp ${searchArgs.join(' ')}`, { 
        encoding: 'utf8',
        timeout: 30000 
      }).trim();
      
      if (videoId) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        await downloadVideo(videoUrl, outputPath, category);
        return outputPath;
      }
    } catch (error) {
      log(`Search query "${query}" failed for ${category}: ${error.message}`, 'error');
      await sleep(2000); // Wait before trying next query
    }
  }
  
  // Try fallback URLs
  for (const url of config.fallbackUrls) {
    try {
      log(`Trying fallback URL for ${category}: ${url}`);
      await downloadVideo(url, outputPath, category);
      return outputPath;
    } catch (error) {
      log(`Fallback URL failed for ${category}: ${error.message}`, 'error');
      await sleep(2000); // Wait before trying next URL
    }
  }
  
  throw new Error(`All download attempts failed for ${category}`);
}

// Create seamless loop using FFmpeg
async function createSeamlessLoop(inputPath, outputPath, category) {
  return new Promise((resolve, reject) => {
    log(`Creating seamless loop for ${category}...`);
    
    const args = [
      '-i', inputPath,
      '-filter_complex', 'afade=t=in:st=0:d=3,afade=t=out:st=357:d=3,aloop=loop=-1:size=2.1e+08',
      '-t', '3600', // 1 hour
      '-y',
      outputPath
    ];

    const process = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';
    let timeout;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (!process.killed) process.kill();
    };

    timeout = setTimeout(() => {
      log(`Timeout creating loop for ${category}`, 'error');
      cleanup();
      reject(new Error('FFmpeg timeout'));
    }, 300000); // 5 minute timeout

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      cleanup();
      
      if (code === 0) {
        const stats = fs.statSync(outputPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        log(`Created ${category} loop (${sizeMB}MB)`, 'success');
        resolve(outputPath);
      } else {
        log(`FFmpeg failed for ${category}: ${stderr}`, 'error');
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      cleanup();
      log(`FFmpeg process error for ${category}: ${error.message}`, 'error');
      reject(error);
    });
  });
}

// Main processing function
async function processCategory(category, config) {
  log(`\n=== Processing ${category} ===`);
  
  try {
    // Download video
    const tempPath = await downloadWithFallback(category, config);
    
    // Create seamless loop
    const finalPath = path.join(OUTPUT_DIR, `${category}_loop.mp3`);
    await createSeamlessLoop(tempPath, finalPath, category);
    
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    log(`✅ ${category} completed successfully`);
    return true;
    
  } catch (error) {
    log(`❌ ${category} failed: ${error.message}`, 'error');
    return false;
  }
}

// Example usage of Firestore utilities
async function firestoreDemo() {
  const testUserId = 'demo-user';
  const testGoals = [
    { id: 'goal1', title: 'Test Goal 1', createdAt: new Date().toISOString() },
    { id: 'goal2', title: 'Test Goal 2', createdAt: new Date().toISOString() }
  ];

  // Save goals
  await saveUserData(testUserId, 'goals', testGoals);
  console.log('Saved test goals to Firestore');

  // Retrieve goals
  const loadedGoals = await getUserData(testUserId, 'goals');
  console.log('Loaded goals from Firestore:', loadedGoals);

  // Delete goals
  await deleteUserData(testUserId, 'goals');
  console.log('Deleted test goals from Firestore');
}

// Uncomment to run the demo
// firestoreDemo();

// Main execution
async function main() {
  log('🎵 Starting YouTube ambient sound processing...');
  
  // Check if yt-dlp is installed
  if (!checkYtDlp()) {
    log('yt-dlp is not installed. Please install it first:', 'error');
    log('pip install yt-dlp', 'error');
    process.exit(1);
  }
  
  // Check if FFmpeg is installed
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch (error) {
    log('FFmpeg is not installed. Please install it first:', 'error');
    log('brew install ffmpeg (macOS) or apt-get install ffmpeg (Ubuntu)', 'error');
    process.exit(1);
  }
  
  // Ensure output directory exists
  ensureDirectoryExists(OUTPUT_DIR);
  
  // Process each category
  const results = [];
  
  for (const [category, config] of Object.entries(SOUND_CATEGORIES)) {
    const success = await processCategory(category, config);
    results.push({ category, success });
    
    // Wait between categories to avoid overwhelming the system
    await sleep(3000);
  }
  
  // Summary
  log('\n=== Processing Summary ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log(`✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => log(`  - ${r.category}`));
  
  if (failed.length > 0) {
    log(`❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => log(`  - ${r.category}`));
  }
  
  // Clean up temp directory
  const tempDir = path.join(OUTPUT_DIR, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    log('Cleaned up temporary files');
  }
  
  log('🎵 Processing complete!');
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run the script
main().catch(error => {
  log(`Script failed: ${error.message}`, 'error');
  process.exit(1);
}); 