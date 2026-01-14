import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

export function extractAudio(videoPath) {
  return new Promise((resolve, reject) => {
    const output = `${videoPath}.wav`;

    ffmpeg(videoPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec("pcm_s16le")
      .output(output)
      .on("end", () => resolve(output))
      .on("error", (err) => reject(err))
      .run();
  });
}
