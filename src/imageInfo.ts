export interface ImageInfo {
  /**
   * When you have shared album URL that can get via Google Photos API, that should be like below:
   *
   * `https://photos.app.goo.gl/${shortAlbumUID}`
   *
   * When you access to the URL, it will be redirected. Then, you can get `albumUID` and `key`
   *
   * ```js
   * console.log(await fetch(`https://photos.app.goo.gl/${shortAlbumUID}`).then(r => r.url)); // => https://photos.google.com/share/${albumUID}?key=${key}
   * ```
   * Also, you can get the `uid` that identify the photo you select. The `uid` can get via `GooglePhotos.Album.fetchImageUrls`
   *
   * Now, you can get the URL of the photo page.
   *
   * `https://photos.google.com/share/${albumUID}/photo/${uid}?key=${key}`
   */
  uid: string;
  /**
   * Base googleusercontent URL for this item.
   * Serves a still image (photo, or video poster/thumbnail). Kept for backward compatibility;
   * prefer `posterUrl` / `videoUrl` when you care about media type.
   */
  url: string;
  /**
   * Still-image URL (photo binary, or video poster/thumbnail).
   * Same base URL as `url`. Append `=w${width}-h${height}` for a larger size.
   */
  posterUrl: string;
  /**
   * Downloadable video URL when `isVideo` is true (`${url}=dv`); otherwise `null`.
   * Content type is typically `video/mp4` or `video/quicktime`.
   */
  videoUrl: string | null;
  /** True when the album entry is a video (detected via shared-page metadata). */
  isVideo: boolean;
  width: number;
  height: number;
  /** The epoch time when image was updated */
  imageUpdateDate: number;
  /** The epoch time when image was added to this album */
  albumAddDate: number;
}
