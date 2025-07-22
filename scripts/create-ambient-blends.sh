#!/bin/bash

# Script to blend multiple ambient sound files into seamless loops
# Creates 5 final files: rain-blend.mp3, ocean-blend.mp3, forest-blend.mp3, cafe-blend.mp3, whitenoise-blend.mp3

echo "🎵 Creating seamless ambient sound blends..."

# Create blended directory for final files
mkdir -p blended

# Function to create seamless blend from multiple files
create_blend() {
    local category=$1
    local pattern=$2
    local output_name=$3
    
    echo "📁 Processing $category sounds..."
    
    # Get all files matching the pattern
    files=($(ls $pattern 2>/dev/null))
    
    if [ ${#files[@]} -eq 0 ]; then
        echo "⚠️  No files found for pattern: $pattern"
        return 1
    fi
    
    echo "   Found ${#files[@]} files for $category"
    
    # Create a temporary concat file list
    temp_list="temp_${category}_list.txt"
    rm -f "$temp_list"
    
    # Add each file to the concat list (repeat each file for smoother blending)
    for file in "${files[@]}"; do
        echo "file '$file'" >> "$temp_list"
        echo "file '$file'" >> "$temp_list"  # Repeat for longer blend
    done
    
    # Use FFmpeg to concatenate and create seamless loop
    echo "   🔄 Blending files..."
    ffmpeg -f concat -safe 0 -i "$temp_list" \
           -filter_complex "[0:a]afade=t=in:st=0:d=2,afade=t=out:st=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${files[0]}" | awk '{print $1*'${#files[@]}'*2-2}'):d=2[audio]" \
           -map "[audio]" \
           -c:a libmp3lame -b:a 128k \
           -y "blended/${output_name}" \
           -v quiet
    
    # Clean up temp file
    rm -f "$temp_list"
    
    if [ -f "blended/${output_name}" ]; then
        local size=$(du -h "blended/${output_name}" | cut -f1)
        echo "   ✅ Created: blended/${output_name} (${size})"
    else
        echo "   ❌ Failed to create: blended/${output_name}"
    fi
}

# Create blends for each category
create_blend "Rain" "*Rain*" "rain-blend.mp3"
create_blend "Ocean" "*Ocean*" "ocean-blend.mp3"  
create_blend "Forest" "*Forest*" "forest-blend.mp3"
create_blend "Cafe" "*Cafe*" "cafe-blend.mp3"
create_blend "White Noise" "*White*" "whitenoise-blend.mp3"

echo ""
echo "🎉 Blend creation complete!"
echo "📁 Final files created in 'blended/' directory:"
ls -lh blended/*.mp3 2>/dev/null

# Copy the blended files to replace the simple ones
echo ""
echo "🔄 Replacing simple sound files with blended versions..."
cp blended/rain-blend.mp3 rain.mp3
cp blended/ocean-blend.mp3 ocean.mp3
cp blended/forest-blend.mp3 forest.mp3
cp blended/cafe-blend.mp3 cafe.mp3
cp blended/whitenoise-blend.mp3 whitenoise.mp3

echo "✅ All sound files updated with seamless blends!"
echo "📊 Final file sizes:"
ls -lh rain.mp3 ocean.mp3 forest.mp3 cafe.mp3 whitenoise.mp3
