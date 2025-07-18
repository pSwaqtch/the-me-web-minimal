#!/usr/bin/env python3
"""
Media to WebP Converter
Converts images and videos to WebP format with quality options
Supports batch processing and maintains directory structure
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image
import subprocess
import shutil

# Supported file extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', '.webp'}
VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp'}

def check_dependencies():
    """Check if required tools are installed"""
    if not shutil.which('ffmpeg'):
        print("Error: ffmpeg is required for video conversion")
        print("Install with: sudo apt install ffmpeg (Ubuntu) or brew install ffmpeg (macOS)")
        return False
    return True

def convert_image_to_webp(input_path, output_path, quality=85):
    """Convert image to WebP format"""
    try:
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')

            # Save as WebP
            img.save(output_path, 'WebP', quality=quality, optimize=True)
            return True
    except Exception as e:
        print(f"Error converting {input_path}: {str(e)}")
        return False

def convert_video_to_webp(input_path, output_path, quality=85):
    """Convert video to animated WebP using ffmpeg"""
    try:
        # Map quality (0-100) to ffmpeg crf (0-63, lower is better)
        crf = max(0, min(63, int((100 - quality) * 0.63)))

        cmd = [
            'ffmpeg', '-i', str(input_path),
            '-vcodec', 'libwebp',
            '-crf', str(crf),
            '-preset', 'default',
            '-an',  # Remove audio
            '-vsync', '0',
            '-y',  # Overwrite output
            str(output_path)
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            return True
        else:
            print(f"FFmpeg error for {input_path}: {result.stderr}")
            return False
    except Exception as e:
        print(f"Error converting video {input_path}: {str(e)}")
        return False

def get_output_path(input_path, output_dir, preserve_structure, base_input_dir):
    """Generate output path for converted file"""
    input_path = Path(input_path)

    if preserve_structure and base_input_dir:
        # Maintain directory structure
        relative_path = input_path.relative_to(base_input_dir)
        output_path = Path(output_dir) / relative_path.with_suffix('.webp')
        output_path.parent.mkdir(parents=True, exist_ok=True)
    else:
        # Flat structure
        output_path = Path(output_dir) / f"{input_path.stem}.webp"

    return output_path

def process_directory(input_dir, output_dir, quality=85, preserve_structure=True, include_videos=True):
    """Process all media files in a directory"""
    input_dir = Path(input_dir)
    output_dir = Path(output_dir)

    if not input_dir.exists():
        print(f"Error: Input directory {input_dir} does not exist")
        return

    output_dir.mkdir(parents=True, exist_ok=True)

    # Find all media files
    media_files = []
    extensions = IMAGE_EXTENSIONS.copy()
    if include_videos:
        extensions.update(VIDEO_EXTENSIONS)

    for ext in extensions:
        media_files.extend(input_dir.rglob(f"*{ext}"))
        media_files.extend(input_dir.rglob(f"*{ext.upper()}"))

    if not media_files:
        print(f"No media files found in {input_dir}")
        return

    print(f"Found {len(media_files)} media files")
    converted = 0
    failed = 0

    for file_path in media_files:
        print(f"Processing: {file_path.name}")

        output_path = get_output_path(file_path, output_dir, preserve_structure, input_dir)

        # Skip if output already exists
        if output_path.exists():
            print(f"  Skipping (already exists): {output_path}")
            continue

        # Convert based on file type
        if file_path.suffix.lower() in IMAGE_EXTENSIONS:
            success = convert_image_to_webp(file_path, output_path, quality)
        elif file_path.suffix.lower() in VIDEO_EXTENSIONS:
            if not include_videos:
                continue
            success = convert_video_to_webp(file_path, output_path, quality)
        else:
            continue

        if success:
            original_size = file_path.stat().st_size
            new_size = output_path.stat().st_size
            compression_ratio = (1 - new_size / original_size) * 100
            print(f"  ✓ Converted: {output_path} ({compression_ratio:.1f}% smaller)")
            converted += 1
        else:
            failed += 1

    print(f"\nConversion complete!")
    print(f"Converted: {converted} files")
    print(f"Failed: {failed} files")

def process_single_file(input_file, output_file=None, quality=85):
    """Process a single media file"""
    input_path = Path(input_file)

    if not input_path.exists():
        print(f"Error: File {input_file} does not exist")
        return

    if output_file is None:
        output_path = input_path.with_suffix('.webp')
    else:
        output_path = Path(output_file)

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Converting: {input_path} -> {output_path}")

    # Convert based on file type
    if input_path.suffix.lower() in IMAGE_EXTENSIONS:
        success = convert_image_to_webp(input_path, output_path, quality)
    elif input_path.suffix.lower() in VIDEO_EXTENSIONS:
        success = convert_video_to_webp(input_path, output_path, quality)
    else:
        print(f"Error: Unsupported file type {input_path.suffix}")
        return

    if success:
        original_size = input_path.stat().st_size
        new_size = output_path.stat().st_size
        compression_ratio = (1 - new_size / original_size) * 100
        print(f"✓ Conversion successful! ({compression_ratio:.1f}% smaller)")
    else:
        print("✗ Conversion failed!")

def main():
    parser = argparse.ArgumentParser(description="Convert images and videos to WebP format")
    parser.add_argument('input', help='Input file or directory')
    parser.add_argument('-o', '--output', help='Output file or directory')
    parser.add_argument('-q', '--quality', type=int, default=85,
                       help='Quality (0-100, default: 85)')
    parser.add_argument('--no-videos', action='store_true',
                       help='Skip video files')
    parser.add_argument('--flat', action='store_true',
                       help='Save all files in output directory (no subdirectories)')

    args = parser.parse_args()

    # Check dependencies
    if not check_dependencies():
        sys.exit(1)

    # Validate quality
    if not 0 <= args.quality <= 100:
        print("Error: Quality must be between 0 and 100")
        sys.exit(1)

    input_path = Path(args.input)

    if input_path.is_file():
        # Single file mode
        process_single_file(args.input, args.output, args.quality)
    elif input_path.is_dir():
        # Directory mode
        if args.output is None:
            output_dir = input_path / 'webp_converted'
        else:
            output_dir = args.output

        process_directory(
            args.input,
            output_dir,
            quality=args.quality,
            preserve_structure=not args.flat,
            include_videos=not args.no_videos
        )
    else:
        print(f"Error: {args.input} is not a valid file or directory")
        sys.exit(1)

if __name__ == "__main__":
    main()
