import os, subprocess, imageio_ffmpeg
from PIL import Image

ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()

video_src = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\videos\short-pita-curcuma.mp4"
video_mp4_opt = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\videos\short-pita-curcuma-opt.mp4"
video_webm_opt = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\videos\short-pita-curcuma.webm"
poster_path = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\videos\hero-poster.webp"

print("Original video size:", os.path.getsize(video_src), "bytes")

# 1. Compress to optimized MP4 (H.264, no audio, CRF 26, faststart for streaming)
cmd_mp4 = [
    ffmpeg_bin, "-y", "-i", video_src,
    "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-an",
    "-movflags", "+faststart",
    video_mp4_opt
]
subprocess.run(cmd_mp4, check=True)
print("Optimized MP4 size:", os.path.getsize(video_mp4_opt), "bytes")

# 2. Compress to optimized WebM (VP9, no audio, CRF 30)
cmd_webm = [
    ffmpeg_bin, "-y", "-i", video_src,
    "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-an",
    video_webm_opt
]
subprocess.run(cmd_webm, check=True)
print("Optimized WebM size:", os.path.getsize(video_webm_opt), "bytes")

# 3. Extract Frame 1 as WebP Poster
cmd_poster = [
    ffmpeg_bin, "-y", "-i", video_src,
    "-ss", "00:00:00.500", "-vframes", "1",
    "-q:v", "80",
    poster_path
]
subprocess.run(cmd_poster, check=True)
print("Extracted poster size:", os.path.getsize(poster_path), "bytes")

# Replace original video with optimized MP4
os.replace(video_mp4_opt, video_src)
print("Successfully replaced original video with optimized version!")
