const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const RAW_SOUNDS_DIR = path.resolve('public/assets/sounds/raw');
const OUTPUT_DIR = path.resolve('public/assets/sounds');
const LOOP_DURATION = 300; // 5 minutes in seconds
const CROSSFADE_DURATION = 3; // 3 seconds crossfade for smoother transitions

// Sound categories
const categories = ['rain', 'forest', 'ocean', 'cafe', 'whitenoise'];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getSoundFiles(category) {
  const categoryDir = path.join(RAW_SOUNDS_DIR, category);
  if (!fs.existsSync(categoryDir)) {
    console.log(`Category directory not found: ${categoryDir}`);
    return [];
  }
  
  const files = fs.readdirSync(categoryDir)
    .filter(file => file.endsWith('.mp3') && !file.includes('README'))
    .map(file => path.join(categoryDir, file));
  
  return files;
}

function createSeamlessLoop(category, inputFiles) {
  if (inputFiles.length === 0) {
    console.log(`No input files found for category: ${category}`);
    return;
  }

  const outputFile = path.join(OUTPUT_DIR, `${category}.mp3`);
  const tempDir = path.join(OUTPUT_DIR, 'temp');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log(`Processing ${category} with ${inputFiles.length} files...`);
    
    // Step 1: Create a more sophisticated seamless loop using FFmpeg's complex filter
    const inputArgs = inputFiles.map(file => `-i "${file}"`).join(' ');
    
    // Create a filter complex that creates seamless crossfades and loops
    let filterComplex = '';
    
    if (inputFiles.length === 1) {
      // Single file: just loop it seamlessly
      filterComplex = `[0:0]aloop=loop=-1:size=2*44100,atrim=0:${LOOP_DURATION}[out]`;
    } else {
      // Multiple files: create crossfaded chain with seamless loop
      for (let i = 0; i < inputFiles.length - 1; i++) {
        if (i === 0) {
          filterComplex += `[0:0][1:0]acrossfade=d=${CROSSFADE_DURATION}:c1=tri:c2=tri[a${i}];`;
        } else {
          filterComplex += `[a${i-1}][${i+1}:0]acrossfade=d=${CROSSFADE_DURATION}:c1=tri:c2=tri[a${i}];`;
        }
      }
      
      // Create seamless loop by crossfading the last segment with the first
      const lastIndex = inputFiles.length - 1;
      filterComplex += `[a${lastIndex-1}][0:0]acrossfade=d=${CROSSFADE_DURATION}:c1=tri:c2=tri,aloop=loop=-1:size=2*44100,atrim=0:${LOOP_DURATION}[out]`;
    }

    const command = `ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" -map "[out]" -c:a mp3 -b:a 128k -ar 44100 "${outputFile}"`;
    
    console.log(`Creating seamless loop for ${category}...`);
    execSync(command, { stdio: 'pipe' });
    
    console.log(`✅ Created seamless loop: ${outputFile}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${category}:`, error.message);
    
    // Fallback: simpler approach with better error handling
    try {
      console.log(`Trying fallback method for ${category}...`);
      
      const inputArgs = inputFiles.map(file => `-i "${file}"`).join(' ');
      
      // Simpler crossfade chain
      let filterComplex = '';
      for (let i = 0; i < inputFiles.length - 1; i++) {
        if (i === 0) {
          filterComplex += `[0:0][1:0]acrossfade=d=${CROSSFADE_DURATION}:c1=tri:c2=tri[a${i}];`;
        } else {
          filterComplex += `[a${i-1}][${i+1}:0]acrossfade=d=${CROSSFADE_DURATION}:c1=tri:c2=tri[a${i}];`;
        }
      }
      
      // Add loop and trim
      const lastIndex = inputFiles.length - 1;
      filterComplex += `[a${lastIndex-1}]aloop=loop=-1:size=2*44100,atrim=0:${LOOP_DURATION}[out]`;
      
      const command = `ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" -map "[out]" -c:a mp3 -b:a 128k -ar 44100 "${outputFile}"`;
      
      execSync(command, { stdio: 'pipe' });
      console.log(`✅ Created fallback loop: ${outputFile}`);
      
    } catch (fallbackError) {
      console.error(`❌ Fallback also failed for ${category}:`, fallbackError.message);
      
      // Last resort: simple concatenation
      try {
        console.log(`Trying simple concatenation for ${category}...`);
        
        const inputArgs = inputFiles.map(file => `-i "${file}"`).join(' ');
        const filterComplex = inputFiles.map((_, index) => `[${index}:0]`).join('') + `concat=n=${inputFiles.length}:v=0:a=1,aloop=loop=-1:size=2*44100,atrim=0:${LOOP_DURATION}[out]`;
        
        const command = `ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" -map "[out]" -c:a mp3 -b:a 128k -ar 44100 "${outputFile}"`;
        
        execSync(command, { stdio: 'pipe' });
        console.log(`✅ Created simple loop: ${outputFile}`);
        
      } catch (simpleError) {
        console.error(`❌ All methods failed for ${category}:`, simpleError.message);
      }
    }
  }
}

function processCompletionSounds() {
  const completionDir = path.join(RAW_SOUNDS_DIR, 'completion');
  const outputFile = path.join(OUTPUT_DIR, 'chime.mp3');
  
  if (!fs.existsSync(completionDir)) {
    console.log('Completion directory not found');
    return;
  }
  
  const files = fs.readdirSync(completionDir)
    .filter(file => file.endsWith('.mp3') && !file.includes('README'))
    .map(file => path.join(completionDir, file));
  
  if (files.length === 0) {
    console.log('No completion sound files found');
    return;
  }
  
  try {
    const inputFile = files[0];
    const command = `ffmpeg -y -i "${inputFile}" -c:a mp3 -b:a 128k -ar 44100 "${outputFile}"`;
    
    console.log('Processing completion sounds...');
    execSync(command, { stdio: 'pipe' });
    
    console.log(`✅ Created completion sound: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error processing completion sounds:', error.message);
  }
}

// Alternative: YouTube audio processing function
async function processYouTubeAudio(category, youtubeUrls) {
  console.log(`Processing ${category} from YouTube URLs...`);
  
  // This would require youtube-dl or yt-dlp to be installed
  // For now, we'll just show the concept
  console.log(`Would process YouTube URLs for ${category}:`, youtubeUrls);
  console.log('To implement this, install yt-dlp and uncomment the YouTube processing code');
  
  /*
  // Example implementation (requires yt-dlp):
  for (let i = 0; i < youtubeUrls.length; i++) {
    const url = youtubeUrls[i];
    const outputFile = path.join(RAW_SOUNDS_DIR, category, `youtube_${i}.mp3`);
    
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputFile}" "${url}"`;
    execSync(command, { stdio: 'pipe' });
  }
  */
}

// Example usage of Firestore utilities
async function firestoreDemo() {
  const testUserId = 'demo-user';
  const testSettings = [
    { id: 'settings', theme: 'dark', notifications: true, createdAt: new Date().toISOString() }
  ];

  // Save app settings
  // await saveUserData(testUserId, 'appSettings', testSettings); // REMOVED
  // console.log('Saved test app settings to Firestore');

  // Retrieve app settings
  // const loadedSettings = await getUserData(testUserId, 'appSettings'); // REMOVED
  // console.log('Loaded app settings from Firestore:', loadedSettings);

  // Delete app settings
  // await deleteUserData(testUserId, 'appSettings'); // REMOVED
  // console.log('Deleted test app settings from Firestore');
}

// Uncomment to run the demo
// firestoreDemo();

// Main processing
console.log('🎵 Starting enhanced sound processing...\n');

// Process each category
categories.forEach(category => {
  const files = getSoundFiles(category);
  if (files.length > 0) {
    createSeamlessLoop(category, files);
  }
});

// Process completion sounds
processCompletionSounds();

console.log('\n🎵 Enhanced sound processing complete!');
console.log('Generated files:');
categories.forEach(category => {
  const outputFile = path.join(OUTPUT_DIR, `${category}.mp3`);
  if (fs.existsSync(outputFile)) {
    console.log(`  ✅ ${category}.mp3`);
  }
});

if (fs.existsSync(path.join(OUTPUT_DIR, 'chime.mp3'))) {
  console.log('  ✅ chime.mp3');
}

console.log('\n📁 Check the output in: public/assets/sounds/');
console.log('\n💡 For even better results, consider:');
console.log('   - Using longer source clips (30+ seconds)');
console.log('   - Ensuring source clips have similar volume levels');
console.log('   - Using clips with natural fade in/out points'); 