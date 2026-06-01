import { spawn } from 'child_process';

let state = {
  controller: null,
  ffplay: null,
  muted: false,
  backendUrl: null,
  channel: null,
  onError: null,
};

function parseDuration(pt) {
  const m = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
  return (+(m?.[1] || 0)) * 3600 + (+(m?.[2] || 0)) * 60 + (+(m?.[3] || 0));
}

const RADIO_EPOCH = new Date('2024-05-04T13:37:00+01:00').getTime() / 1000;

function parseMpd(xml) {
  const totalDuration = parseDuration(
    xml.match(/mediaPresentationDuration="([^"]*)"/)?.[1] || 'PT0S'
  );
  const periods = [];
  const periodRe = /<Period([^>]*)>([\s\S]*?)<\/Period>/g;
  let pm;
  while ((pm = periodRe.exec(xml))) {
    const attrs = pm[1];
    const body = pm[2];
    const duration = parseDuration(attrs.match(/duration="([^"]*)"/)?.[1] || 'PT0S');
    const init = body.match(/initialization="([^"]*)"/)?.[1];
    const media = body.match(/media="([^"]*)"/)?.[1];
    const startNumber = parseInt(body.match(/startNumber="([^"]*)"/)?.[1] || '1');
    const timescale = parseInt(body.match(/timescale="([^"]*)"/)?.[1] || '1000000');
    const segDuration = parseInt(body.match(/\bduration="(\d+)"/)?.[1] || '5000000');
    const segSeconds = segDuration / timescale;
    const segCount = Math.ceil(duration / segSeconds);
    if (init && media && segCount > 0) {
      periods.push({ init, media, startNumber, segCount, segSeconds, duration });
    }
  }
  return { totalDuration, periods };
}

function computeStartOffset(totalDuration) {
  const now = Date.now() / 1000;
  return (now - RADIO_EPOCH) % totalDuration;
}

// Returns { periodIndex, segmentOffset } — where to start in the segment list
function resolveStartPosition(periods, startOffset) {
  let elapsed = 0;
  for (let p = 0; p < periods.length; p++) {
    const { duration, segSeconds } = periods[p];
    if (elapsed + duration > startOffset) {
      const offsetInPeriod = startOffset - elapsed;
      const segmentOffset = Math.floor(offsetInPeriod / segSeconds);
      return { periodIndex: p, segmentOffset };
    }
    elapsed += duration;
  }
  return { periodIndex: 0, segmentOffset: 0 };
}

async function fetchBuf(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function streamSegments(backendUrl, channel, stdin, signal) {
  const mpdRes = await fetch(`${backendUrl}/${channel}`, { signal });
  const mpdText = await mpdRes.text();
  const { totalDuration, periods } = parseMpd(mpdText);
  if (!periods.length) throw new Error('No playable periods found in MPD');

  const startOffset = computeStartOffset(totalDuration);
  let { periodIndex, segmentOffset } = resolveStartPosition(periods, startOffset);

  while (!signal.aborted) {
    for (let p = periodIndex; p < periods.length; p++) {
      if (signal.aborted) break;
      const { init, media, startNumber, segCount } = periods[p];
      const firstSeg = p === periodIndex ? segmentOffset : 0;

      const initBuf = await fetchBuf(init, signal);
      if (signal.aborted || !stdin.writable) return;
      stdin.write(initBuf);

      for (let i = startNumber + firstSeg; i < startNumber + segCount; i++) {
        if (signal.aborted || !stdin.writable) return;
        const buf = await fetchBuf(media.replace('$Number$', i), signal);
        if (signal.aborted || !stdin.writable) return;
        stdin.write(buf);
      }
    }
    // Loop back to the beginning
    periodIndex = 0;
    segmentOffset = 0;
  }
}

function spawnFfplay(muted) {
  const args = ['-nodisp', '-loglevel', 'quiet', '-i', 'pipe:0'];
  if (muted) args.push('-af', 'volume=0');
  const proc = spawn('ffplay', args, { stdio: ['pipe', 'ignore', 'ignore'] });
  proc.stdin.on('error', () => {}); // ignore EPIPE on abort
  return proc;
}

export function start(backendUrl, channel, { muted = false, onError } = {}) {
  stop();

  state.backendUrl = backendUrl;
  state.channel = channel;
  state.muted = muted;
  state.onError = onError;

  const controller = new AbortController();
  state.controller = controller;

  const ffplay = spawnFfplay(muted);
  state.ffplay = ffplay;
  ffplay.on('error', () => onError?.('ffplay not found — install ffmpeg to use this app'));

  streamSegments(backendUrl, channel, ffplay.stdin, controller.signal).catch((err) => {
    if (err.name !== 'AbortError') onError?.(err.message);
  });
}

export function stop() {
  state.controller?.abort();
  if (state.ffplay) {
    state.ffplay.stdin.end();
    state.ffplay.kill();
    state.ffplay = null;
  }
  state.controller = null;
}

export async function toggleMute() {
  state.muted = !state.muted;
  start(state.backendUrl, state.channel, { muted: state.muted, onError: state.onError });
  return state.muted;
}

export function isMuted() {
  return state.muted;
}
