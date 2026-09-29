import os, subprocess, imageio_ffmpeg

ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()

src_video = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\Short Pita Cúrcuma.mp4"
target_mp4 = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\videos\short-pita-curcuma.mp4"
target_webm = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\videos\short-pita-curcuma.webm"
target_poster = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\videos\hero-poster.webp"

print("Re-encoding video with 100% exact 1.0x normal speed and CFR 25fps...")

# 1. MP4 Encoding (1.0x normal speed, CFR 25fps, CRF 23 for crisp HD quality, keyframe distance 50 frames)
cmd_mp4 = [
    ffmpeg_bin, "-y",
    "-i", src_video,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-r", "25",
    "-g", "50",
    "-pix_fmt", "yuv420p",
    "-an",
    "-movflags", "+faststart",
    target_mp4
]
subprocess.run(cmd_mp4, check=True)
print("Saved 1.0x MP4:", os.path.getsize(target_mp4), "bytes")

# 2. WebM Encoding (1.0x normal speed, VP9, CRF 26)
cmd_webm = [
    ffmpeg_bin, "-y",
    "-i", src_video,
    "-c:v", "libvpx-vp9",
    "-crf", "26",
    "-b:v", "0",
    "-r", "25",
    "-g", "50",
    "-pix_fmt", "yuv420p",
    "-an",
    target_webm
]
subprocess.run(cmd_webm, check=True)
print("Saved 1.0x WebM:", os.path.getsize(target_webm), "bytes")

# 3. Poster image
cmd_poster = [
    ffmpeg_bin, "-y",
    "-i", src_video,
    "-ss", "00:00:01.000",
    "-vframes", "1",
    "-q:v", "85",
    target_poster
]
subprocess.run(cmd_poster, check=True)
print("Saved poster WebP:", os.path.getsize(target_poster), "bytes")

print("Done! Video re-encoded with 100% normal playback speed.")
