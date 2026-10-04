#!/usr/bin/env bash
set -e

SRC="${1:-Logo.png}"

if [ ! -f "$SRC" ]; then
  echo "File $SRC not found!"
  exit 1
fi

RES_DIR="android/app/src/main/res"

# Extract corner background color from source image
BG_HEX=$(convert "$SRC" -crop 20x20+0+0 -scale 1x1\! -depth 8 -format "%[hex:p{0,0}]" info: | head -c 6)
BG_COLOR="#${BG_HEX}"
echo "Detected background color: $BG_COLOR"

densities=("mdpi:48:108" "hdpi:72:162" "xhdpi:96:216" "xxhdpi:144:324" "xxxhdpi:192:432")

for entry in "${densities[@]}"; do
  IFS=":" read -r name size fg_size <<< "$entry"
  dir="$RES_DIR/mipmap-$name"
  mkdir -p "$dir"

  # Standard launcher icon
  convert "$SRC" -resize "${size}x${size}" "$dir/ic_launcher.png"

  # Round launcher icon with clean circular mask
  radius=$(( size / 2 ))
  convert "$SRC" -resize "${size}x${size}" \
    \( -size "${size}x${size}" xc:none -fill white -draw "circle $radius,$radius $radius,1" \) \
    -compose DstIn -composite "$dir/ic_launcher_round.png"

  # Adaptive icon foreground (slightly scaled to 92% with matching background color to ensure zero clipping within safe zone)
  fg_inner=$(( fg_size * 92 / 100 ))
  convert "$SRC" -resize "${fg_inner}x${fg_inner}" -background "$BG_COLOR" -gravity center -extent "${fg_size}x${fg_size}" "$dir/ic_launcher_foreground.png"

  echo "Generated icons for $name ($size x $size, foreground: $fg_size x $fg_size)"
done

echo "All Android launcher icons updated successfully!"
