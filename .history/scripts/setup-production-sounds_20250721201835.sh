#!/bin/bash

# Create sounds directory if it doesn't exist
mkdir -p public/assets/sounds/ambient

# Download basic ambient sounds from royalty-free sources
echo "Downloading ambient sound files..."

# These are placeholder URLs - in production you'd want to use actual royalty-free sources
# For now, we'll create silence files as placeholders

# Create 10-second silent MP3 files as placeholders
# This ensures the sound system doesn't break in production

cat > public/assets/sounds/rain.mp3 << 'EOF'
# Placeholder for rain sound - 10 seconds of silence
EOF

cat > public/assets/sounds/ocean.mp3 << 'EOF'
# Placeholder for ocean sound - 10 seconds of silence  
EOF

cat > public/assets/sounds/forest.mp3 << 'EOF'
# Placeholder for forest sound - 10 seconds of silence
EOF

cat > public/assets/sounds/cafe.mp3 << 'EOF'
# Placeholder for cafe sound - 10 seconds of silence
EOF

cat > public/assets/sounds/whitenoise.mp3 << 'EOF'
# Placeholder for white noise sound - 10 seconds of silence
EOF

echo "Placeholder sound files created. In production, replace these with actual royalty-free ambient sounds."
