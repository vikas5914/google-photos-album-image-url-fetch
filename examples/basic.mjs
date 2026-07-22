/**
 * End-to-end example against a real Google Photos shared album.
 *
 * Run from repo root (after `npm run build`):
 *   node examples/basic.mjs
 */
import { fetchImageUrls, extractAppended, validityVerification } from '../dist/index.mjs';

const ALBUM_URL = 'https://photos.app.goo.gl/oJEMCo5g5eUptS2fA';

function fullSizeUrl(info) {
  return `${info.url}=w${info.width}-h${info.height}`;
}

async function main() {
  console.log('1) fetchImageUrls');
  console.log('   album:', ALBUM_URL);

  const images = await fetchImageUrls(ALBUM_URL);
  if (images == null) {
    throw new Error('fetchImageUrls returned null — album HTML parse failed');
  }

  console.log(`   found ${images.length} image(s)\n`);

  for (const [i, img] of images.entries()) {
    console.log(`   [${i}] uid=${img.uid}`);
    console.log(`       size=${img.width}x${img.height}`);
    console.log(`       url=${img.url.slice(0, 72)}…`);
    console.log(`       full=${fullSizeUrl(img).slice(0, 80)}…`);
    console.log(
      `       imageUpdateDate=${new Date(img.imageUpdateDate).toISOString()} albumAddDate=${new Date(img.albumAddDate).toISOString()}`
    );
  }

  console.log('\n2) extractAppended (simulate no new items)');
  const appendedNone = extractAppended(images, images);
  console.log(`   appended count: ${appendedNone.length} (expected 0)`);

  console.log('\n3) extractAppended (simulate one new item)');
  const fakeNew = {
    ...images[0],
    uid: 'example-fake-uid-for-demo',
    url: 'https://example.com/new.jpg',
  };
  const appendedOne = extractAppended(images, [...images, fakeNew]);
  console.log(`   appended count: ${appendedOne.length} (expected 1)`);
  console.log(`   appended uid: ${appendedOne[0]?.uid}`);

  console.log('\n4) AbortSignal cancel');
  const ac = new AbortController();
  ac.abort();
  try {
    await fetchImageUrls(ALBUM_URL, ac.signal);
    console.log('   unexpected: request was not aborted');
  } catch (err) {
    console.log(`   aborted as expected: ${err?.name ?? err}`);
  }

  console.log('\n5) validityVerification (compares live album to expected.json)');
  const ok = await validityVerification();
  console.log(`   result: ${ok}`);

  if (!ok) {
    process.exitCode = 1;
    console.error('\nFAILED: validityVerification returned false');
    return;
  }

  console.log('\nOK — library works end-to-end against a live shared album.');
}

main().catch(err => {
  console.error('\nFAILED:', err);
  process.exitCode = 1;
});
