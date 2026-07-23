import {
  getSharedAlbumHtml,
  parsePhase1,
  parsePhase2,
  parsePhase3,
  isContainData,
  VIDEO_META_KEY,
  VIDEO_URL_SUFFIX,
} from '../src/impl';
import type { ImageInfo } from '../src/imageInfo';
import { googlePhotosSharedAlbumURL } from '../src/constant';

describe('impl', () => {
  it('impl', async () => {
    const html = await getSharedAlbumHtml(googlePhotosSharedAlbumURL);
    expect(html.length).not.toBeUndefined();
    expect(html.length).toBeGreaterThan(10);
    // parsePhase1
    const ph1 = parsePhase1(html);
    expect(ph1).not.toBeNull();
    // parsePhase2
    const ph2 = parsePhase2(ph1 as string);
    if (!isContainData(ph2)) {
      throw new Error('missing data property');
    }
    const ph2Data = ph2.data;
    expect(Array.isArray(ph2Data)).toBe(true);
    const ph2DataChecked = ph2Data as unknown[];
    expect(1 < ph2DataChecked.length).toBe(true);
    expect(Array.isArray(ph2DataChecked[1])).toBe(true);
    const ph2DataCheckedElementChecked = ph2DataChecked[1] as unknown[];
    expect(1 < ph2DataCheckedElementChecked.length).toBe(true);
    // parsePhase3
    const ph3 = parsePhase3(ph2);
    expect(Array.isArray(ph3)).toBe(true);
    const ph3Checked = ph3 as ImageInfo[];
    expect(ph3Checked.length).not.toBe(0);
    for (const item of ph3Checked) {
      expect(item.posterUrl).toBe(item.url);
      expect(typeof item.isVideo).toBe('boolean');
      expect(item.videoUrl).toBe(item.isVideo ? `${item.url}${VIDEO_URL_SUFFIX}` : null);
    }
  });

  it('parsePhase3 detects video via metadata key and builds poster/video urls', () => {
    const photoUrl = 'https://lh3.googleusercontent.com/pw/photo-base';
    const videoUrl = 'https://lh3.googleusercontent.com/pw/video-base';
    const input = {
      data: [
        null,
        [
          ['photo-uid', [photoUrl, 640, 480], 1000, 'tok', 0, 2000, [], [], 2, { '15': 1 }],
          [
            'video-uid',
            [videoUrl, 1080, 1920],
            3000,
            'tok2',
            0,
            4000,
            [],
            [],
            2,
            {
              '15': 1,
              [VIDEO_META_KEY]: [null, null, null, null, null, 1, null, null, null, null, null, null, null, [videoUrl]],
            },
          ],
        ],
      ],
    };
    const result = parsePhase3(input);
    expect(result).toEqual([
      {
        uid: 'photo-uid',
        url: photoUrl,
        posterUrl: photoUrl,
        videoUrl: null,
        isVideo: false,
        width: 640,
        height: 480,
        imageUpdateDate: 1000,
        albumAddDate: 2000,
      },
      {
        uid: 'video-uid',
        url: videoUrl,
        posterUrl: videoUrl,
        videoUrl: `${videoUrl}${VIDEO_URL_SUFFIX}`,
        isVideo: true,
        width: 1080,
        height: 1920,
        imageUpdateDate: 3000,
        albumAddDate: 4000,
      },
    ]);
  });
});
