# google-photos-album-image-url-fetch

[![Node CI](https://github.com/vikas5914/google-photos-album-image-url-fetch/actions/workflows/test.yml/badge.svg)](https://github.com/vikas5914/google-photos-album-image-url-fetch/actions/workflows/test.yml)

Extract public image and video URLs from a Google Photos **shared album** URL — no Google Photos API credentials required.

- **ESM-only** package (`"type": "module"`)
- **Zero runtime dependencies** (JSON5 is bundled)
- Requires **Node.js `^22.18.0 || >=24.11.0`**
- Optional [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) for cancellation

## Install

```bash
npm install google-photos-album-image-url-fetch
```

## Quick start

```ts
import { fetchImageUrls } from 'google-photos-album-image-url-fetch';

const images = await fetchImageUrls('https://photos.app.goo.gl/ea8rFM2SMzp7epUZ6');
console.log(images);
```

With cancellation:

```ts
import { fetchImageUrls } from 'google-photos-album-image-url-fetch';

const ac = new AbortController();
const images = await fetchImageUrls('https://photos.app.goo.gl/ea8rFM2SMzp7epUZ6', ac.signal);
// ac.abort();
```

Runnable example in this repo (after `npm run build`):

```bash
node examples/basic.mjs
```

## `fetchImageUrls`

Fetches a shared album page and returns image metadata, or `null` if parsing fails.

```ts
import { fetchImageUrls, type ImageInfo } from 'google-photos-album-image-url-fetch';

const images: ImageInfo[] | null = await fetchImageUrls('https://photos.app.goo.gl/ea8rFM2SMzp7epUZ6');
```

Example shape (from the sample album — photos + video):

```json
[
  {
    "uid": "AF1QipMIuH7M7OedcncrQJVCZydYiVa_0cO1xpT_ZUQ",
    "url": "https://lh3.googleusercontent.com/pw/AP1GczPZ_oCmthR3rua7uNEp27xhHfdqAjx0EBkf19CGk4cF79rMMwlc4zwUVWNR2R1-0T4jMmTmlhnqX0bEsAPuUBsKz-HLHyeQf09klbNjpqOscCnbIgk",
    "posterUrl": "https://lh3.googleusercontent.com/pw/AP1GczPZ_oCmthR3rua7uNEp27xhHfdqAjx0EBkf19CGk4cF79rMMwlc4zwUVWNR2R1-0T4jMmTmlhnqX0bEsAPuUBsKz-HLHyeQf09klbNjpqOscCnbIgk",
    "videoUrl": null,
    "isVideo": false,
    "width": 4000,
    "height": 3000,
    "imageUpdateDate": 1535348376000,
    "albumAddDate": 1784729658681
  },
  {
    "uid": "AF1QipMMhTEnzITdwWrC9EPH_QjTIb4pKgsezfKHfJM",
    "url": "https://lh3.googleusercontent.com/pw/AP1GczPNMCXxwTMZnmWVVtVtCyeo8urgS5I_lEyVzcxEZ41oQBzwKw2DVAZzImrLjpjD02iXbSNoVULdGQ4EJ_nq9TMvrco_zpEgEln6eXBhXQ-eKExjvIU",
    "posterUrl": "https://lh3.googleusercontent.com/pw/AP1GczPNMCXxwTMZnmWVVtVtCyeo8urgS5I_lEyVzcxEZ41oQBzwKw2DVAZzImrLjpjD02iXbSNoVULdGQ4EJ_nq9TMvrco_zpEgEln6eXBhXQ-eKExjvIU",
    "videoUrl": "https://lh3.googleusercontent.com/pw/AP1GczPNMCXxwTMZnmWVVtVtCyeo8urgS5I_lEyVzcxEZ41oQBzwKw2DVAZzImrLjpjD02iXbSNoVULdGQ4EJ_nq9TMvrco_zpEgEln6eXBhXQ-eKExjvIU=dv",
    "isVideo": true,
    "width": 1920,
    "height": 1080,
    "imageUpdateDate": 1696152201000,
    "albumAddDate": 1784729515451
  }
]
```

Notes:

- `url` / `posterUrl` are durable googleusercontent URLs (not the short-lived base URL from the Photos Library API). For videos, they serve the **poster** (still image), not the video file.
- `isVideo` is `true` for video items. Detection uses reverse-engineered shared-page metadata and is best-effort.
- `videoUrl` is `${url}=dv` when `isVideo` is true (downloadable `video/mp4` or `video/quicktime`); otherwise `null`.
- `imageUpdateDate` and `albumAddDate` are Unix epoch milliseconds.
- Default poster/image URL is a smaller preview. For full size stills, append dimensions:

```ts
const items = await fetchImageUrls(albumUrl);
for (const item of items ?? []) {
  if (item.isVideo) {
    // item.posterUrl — still frame
    // item.videoUrl  — downloadable video (=dv)
  } else {
    const full = `${item.posterUrl}=w${item.width}-h${item.height}`;
    // fetch(full)
  }
}
```

### Sample previews

These embeds use `posterUrl` values from the sample album (same durable googleusercontent hosts CI exercises). If the images below still load, the URLs remain valid.

**Photo**

![sample photo](https://lh3.googleusercontent.com/pw/AP1GczPZ_oCmthR3rua7uNEp27xhHfdqAjx0EBkf19CGk4cF79rMMwlc4zwUVWNR2R1-0T4jMmTmlhnqX0bEsAPuUBsKz-HLHyeQf09klbNjpqOscCnbIgk=w400)

**Video poster** (`isVideo: true` — still frame from `posterUrl`, not the video file)

![sample video poster](https://lh3.googleusercontent.com/pw/AP1GczPNMCXxwTMZnmWVVtVtCyeo8urgS5I_lEyVzcxEZ41oQBzwKw2DVAZzImrLjpjD02iXbSNoVULdGQ4EJ_nq9TMvrco_zpEgEln6eXBhXQ-eKExjvIU=w400)

## `extractAppended`

Diff two snapshots when you re-fetch an album after changes (e.g. after Photos API `batchCreate`):

```ts
import { fetchImageUrls, extractAppended } from 'google-photos-album-image-url-fetch';

const before = (await fetchImageUrls(albumUrl)) ?? [];
// … create media via Google Photos API …
const after = (await fetchImageUrls(albumUrl)) ?? [];
const appended = extractAppended(before, after);
```

## `validityVerification`

Internal/CI helper: fetches the sample album and compares against embedded expected data. Returns `boolean`.

## Notice: multiple `url` formats

Google has used several googleusercontent URL shapes over time, for example:

- `https://lh3.googleusercontent.com/Pt3C6874…` (older style)
- `https://lh3.googleusercontent.com/pw/AL9nZEV…` (seen ~2022)
- `https://lh3.googleusercontent.com/pw/AP1GczN…` (seen ~2023+)

There is no documented way to choose a format. See upstream issues #19 and #23 on the original project.

## Development

```bash
npm ci
npm run build      # tsdown (Rolldown) → dist/
npm test           # vitest
npm run lint       # oxlint
npm run fmt        # oxfmt
npm run typecheck  # tsc --noEmit
```

Stack: **TypeScript**, **tsdown/Rolldown**, **Vitest**, **oxlint**, **oxfmt**.

## License

BSL-1.0 (Boost Software License).

Fork of [yumetodo/google-photos-album-image-url-fetch](https://github.com/yumetodo/google-photos-album-image-url-fetch).
