import type { TimelineInfo } from "../magicMove/types";
import { TYPING_SOUND_FILE } from "./useTypingSound";

const SAMPLE_RATE = 44100;
const VOLUME = 0.5;


/**
 * Encode an AudioBuffer as a 16-bit PCM WAV blob.
 */
function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;

  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write samples as 16-bit signed integers
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Generates a WAV audio blob with typing sound placed at transition positions.
 * Silent during holds, plays the typing MP3 (looped, rate-adjusted) during transitions.
 */
export async function generateTypingAudioTrack(opts: {
  timeline: TimelineInfo;
  stepCount: number;
  transitionMs: number;
  typingDurations: number[] | null;
}): Promise<Blob> {
  const { timeline, stepCount, transitionMs, typingDurations } = opts;

  const durationSec = timeline.totalMs / 1000;
  if (durationSec <= 0 || stepCount <= 1) {
    // Return a tiny silent WAV
    const ctx = new OfflineAudioContext(1, SAMPLE_RATE, SAMPLE_RATE);
    const rendered = await ctx.startRendering();
    return encodeWav(rendered);
  }

  // Decode the typing sound MP3
  const response = await fetch(TYPING_SOUND_FILE);
  const arrayBuffer = await response.arrayBuffer();

  // Use a temporary online AudioContext to decode (OfflineAudioContext.decodeAudioData
  // is not supported in all browsers)
  const tempCtx = new AudioContext();
  let typingBuffer: AudioBuffer;
  try {
    typingBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  } finally {
    await tempCtx.close();
  }

  // Create offline context for the full video duration
  const totalSamples = Math.ceil(durationSec * SAMPLE_RATE);
  const offlineCtx = new OfflineAudioContext(1, totalSamples, SAMPLE_RATE);

  // Master gain for volume control
  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = VOLUME;
  gainNode.connect(offlineCtx.destination);

  // Walk the timeline and schedule audio sources for each transition
  const transitions = stepCount - 1;
  let offsetSec = timeline.startHold / 1000;

  for (let i = 0; i < transitions; i++) {
    const durMs = typingDurations ? typingDurations[i] : transitionMs;
    const durSec = durMs / 1000;

    if (durSec > 0) {
      const source = offlineCtx.createBufferSource();
      source.buffer = typingBuffer;
      source.loop = true;
      source.connect(gainNode);
      source.start(offsetSec);
      source.stop(offsetSec + durSec);
    }

    offsetSec += durSec + timeline.betweenHold / 1000;
  }

  // Render the full audio track
  const rendered = await offlineCtx.startRendering();
  return encodeWav(rendered);
}
