import { isDeepStrictEqual } from 'node:util';
import { getSharedAlbumHtml, parsePhase1, parsePhase2, parsePhase3 } from './impl';
import type { ImageInfo as info } from './imageInfo';
import expected from './expected.json';
import { googlePhotosSharedAlbumURL } from './constant';
import { splitResult } from './split_result';
import { dateCompare } from './date_compare';

export type ImageInfo = info;
export async function fetchImageUrls(albumSharedUrl: string, signal?: AbortSignal): Promise<info[] | null> {
  const html = await getSharedAlbumHtml(albumSharedUrl, signal);
  const ph1 = parsePhase1(html);
  if (null === ph1) {
    return null;
  }
  const ph2 = parsePhase2(ph1);
  if (null === ph2) {
    return null;
  }
  return parsePhase3(ph2);
}
export function extractAppended(before: ImageInfo[], after: ImageInfo[]): info[] {
  return after.filter(a => !before.some(v => isDeepStrictEqual(v, a)));
}
function dateCompareOrFalse(l: number, r: number) {
  try {
    return dateCompare(l, r);
  } catch {
    return false;
  }
}
export async function validityVerification(): Promise<boolean> {
  const re = await fetchImageUrls(googlePhotosSharedAlbumURL);
  if (null === re) {
    return false;
  }
  const [actualRest, actualUrls, actualImageUpdateDates] = splitResult(re);
  const [expectedRest, expectedAnyUrls, expectedImageUpdateDates] = splitResult(expected);
  return (
    expectedAnyUrls.every((expectedAnyUrl, i) => expectedAnyUrl.some(e => e === actualUrls[i])) &&
    expectedImageUpdateDates.every((expectedImageUpdateDate, i) =>
      dateCompareOrFalse(expectedImageUpdateDate, actualImageUpdateDates[i]!)
    ) &&
    isDeepStrictEqual(actualRest, expectedRest)
  );
}
