import type { ImageInfo } from './imageInfo';
import JSON5 from 'json5';

/** 1 initial attempt + 4 retries (matches previous gaxios retry: 4). */
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error('Aborted'));
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason instanceof Error ? signal.reason : new Error('Aborted'));
    };
    timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function getSharedAlbumHtml(albumSharedurl: string, signal?: AbortSignal): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(albumSharedurl, { signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
      if (signal?.aborted) {
        throw err;
      }
      if (attempt === MAX_ATTEMPTS - 1) {
        break;
      }
      await delay(RETRY_DELAY_MS, signal);
    }
  }
  throw lastError;
}

export function parsePhase1(input: string): string | null {
  const re = /(?<=AF_initDataCallback\()(?=.*data)(\{[\s\S]*?)(\);<\/script>)/g;
  const matches = [...input.matchAll(re)];
  if (matches.length === 0) {
    return null;
  }
  return matches.reduce((best, match) => {
    const candidate = match[1] ?? '';
    return best.length > candidate.length ? best : candidate;
  }, '');
}
export function parsePhase2(input: string): unknown {
  try {
    return JSON5.parse(input);
  } catch {
    return null;
  }
}
export interface ContainData {
  data: unknown;
}
export const isContainData = (o: unknown): o is ContainData => typeof o === 'object' && o != null && 'data' in o;
const rawIsArray = Array.isArray;
const isArray = (a: unknown): a is unknown[] => rawIsArray(a);

/**
 * Undocumented Google Photos client metadata key present on video items in shared-album HTML.
 * Not part of a public API; detection is best-effort and may change with Photos frontend updates.
 */
export const VIDEO_META_KEY = '76647426';

/** Video download suffix for googleusercontent base URLs (same convention as Photos Library API). */
export const VIDEO_URL_SUFFIX = '=dv';

function isVideoEntry(entry: unknown[]): boolean {
  const meta = entry[9];
  return typeof meta === 'object' && meta != null && VIDEO_META_KEY in meta;
}

export function parsePhase3(input: unknown): ImageInfo[] | null {
  if (!isContainData(input)) {
    return null;
  }
  const d = input.data;
  if (!isArray(d) || d.length < 1) {
    return null;
  }
  const arr = d[1];
  if (!isArray(arr)) {
    return null;
  }
  return arr
    .map(e => {
      if (!isArray(e) || e.length < 6) {
        return null;
      }
      const uid = e[0];
      const imageUpdateDate = e[2];
      const albumAddDate = e[5];
      if (typeof uid !== 'string' || typeof imageUpdateDate !== 'number' || typeof albumAddDate !== 'number') {
        return null;
      }
      const detail = e[1];
      if (!isArray(detail) || detail.length < 3) {
        return null;
      }
      const url = detail[0];
      const width = detail[1];
      const height = detail[2];
      if (typeof url !== 'string' || typeof width !== 'number' || typeof height !== 'number') {
        return null;
      }
      const isVideo = isVideoEntry(e);
      return {
        uid: uid,
        url: url,
        posterUrl: url,
        videoUrl: isVideo ? `${url}${VIDEO_URL_SUFFIX}` : null,
        isVideo: isVideo,
        width: width,
        height: height,
        imageUpdateDate: imageUpdateDate,
        albumAddDate: albumAddDate,
      };
    })
    .filter((e: ImageInfo | null): e is ImageInfo => !(null === e));
}
