# google-photos-album-image-url-fetch

[![Node CI](https://github.com/vikas5914/google-photos-album-image-url-fetch/actions/workflows/test.yml/badge.svg)](https://github.com/vikas5914/google-photos-album-image-url-fetch/actions/workflows/test.yml)

Extract public image URLs from a Google Photos **shared album** URL — no Google Photos API credentials required.

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

const images = await fetchImageUrls('https://photos.app.goo.gl/oJEMCo5g5eUptS2fA');
console.log(images);
```

With cancellation:

```ts
import { fetchImageUrls } from 'google-photos-album-image-url-fetch';

const ac = new AbortController();
const images = await fetchImageUrls('https://photos.app.goo.gl/oJEMCo5g5eUptS2fA', ac.signal);
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

const images: ImageInfo[] | null = await fetchImageUrls('https://photos.app.goo.gl/oJEMCo5g5eUptS2fA');
```

Example shape:

```json
[
  {
    "uid": "AF1QipO4_Y5pseqWDPSlY7AAo0wmg76xW4gX0kOz8-p_",
    "url": "https://lh3.googleusercontent.com/pw/AP1GczNvhVFAxxjKnpWDoNcWqXQLshSvKgC_L2SHPF6AsdST128i-EPTP77oIJxzNkV7EQUZremYChDrWilSZw0bunJMvtM415hDUMCOWAHaOQEsyi4JfXA",
    "width": 640,
    "height": 480,
    "imageUpdateDate": 1317552314000,
    "albumAddDate": 1564229558506
  }
]
```

Notes:

- `url` is a durable googleusercontent URL (not the short-lived base URL from the Photos Library API).
- `imageUpdateDate` and `albumAddDate` are Unix epoch milliseconds.
- Default `url` is a smaller preview. For full size, append dimensions:

```ts
const images = await fetchImageUrls(albumUrl);
for (const pic of images ?? []) {
  const full = `${pic.url}=w${pic.width}-h${pic.height}`;
  // fetch(full)
}
```

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
