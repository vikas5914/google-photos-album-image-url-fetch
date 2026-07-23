import type { ImageInfo } from './imageInfo';
type ImageInfoWithoutUrl = Omit<ImageInfo, 'url' | 'posterUrl' | 'videoUrl'>;
export type ImageInfoLike = ImageInfoWithoutUrl & {
  url: string | string[];
  posterUrl?: string | string[];
  videoUrl?: string | null;
};
/** Fields compared for equality after stripping volatile URL / date fields. */
export type ImageInfoLikeRest<T extends ImageInfoLike> = Omit<T, 'url' | 'posterUrl' | 'videoUrl' | 'imageUpdateDate'>;
type ImageInfoMaybeLackUrl<T extends ImageInfoLike> = ImageInfoLikeRest<T> & {
  url?: T['url'];
  posterUrl?: T['posterUrl'];
  videoUrl?: T['videoUrl'];
  imageUpdateDate?: T['imageUpdateDate'];
};
export function splitResult<T extends ImageInfoLike>(
  input: Readonly<T>[]
): [ImageInfoLikeRest<T>[], T['url'][], T['imageUpdateDate'][]] {
  const urls: T['url'][] = [];
  const imageUpdateDates: T['imageUpdateDate'][] = [];
  const rest = input.map(e => {
    urls.push(e.url);
    imageUpdateDates.push(e.imageUpdateDate);
    const rest: ImageInfoMaybeLackUrl<T> = { ...e };
    delete rest.url;
    delete rest.posterUrl;
    // videoUrl is derived from url (`${url}=dv`); strip so URL token rotation does not break CI.
    delete rest.videoUrl;
    delete rest.imageUpdateDate;
    return rest;
  });
  return [rest, urls, imageUpdateDates];
}
