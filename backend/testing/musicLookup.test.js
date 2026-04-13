const { lookupSong, lookupFromItunes, lookupFromDeezer, cache } = require('../src/services/musicLookup');

// Clear cache before each test
beforeEach(() => {
  cache.clear();
});

describe('musicLookup', () => {
  // --- iTunes Tests ---

  test('lookupFromItunes returns track data for a known song', async () => {
    const result = await lookupFromItunes('Blinding Lights', 'The Weeknd');
    expect(result).not.toBeNull();
    expect(result.title).toBeDefined();
    expect(result.artist).toBeDefined();
    expect(result.albumArt).toContain('http');
    expect(result.songUrl).toContain('http');
    expect(result.source).toBe('itunes');
    // Album art should be 600x600
    expect(result.albumArt).toContain('600x600');
  }, 10000);

  test('lookupFromItunes returns null for garbage input', async () => {
    const result = await lookupFromItunes('zzzzzxxxxxqqqqq', 'aaaaabbbbbccccc');
    expect(result).toBeNull();
  }, 10000);

  // --- Deezer Tests ---

  test('lookupFromDeezer returns track data for a known song', async () => {
    const result = await lookupFromDeezer('Shape of You', 'Ed Sheeran');
    expect(result).not.toBeNull();
    expect(result.title).toBeDefined();
    expect(result.artist).toBeDefined();
    expect(result.albumArt).toContain('http');
    expect(result.source).toBe('deezer');
  }, 10000);

  // --- Combined lookupSong Tests ---

  test('lookupSong returns data from iTunes or Deezer', async () => {
    const result = await lookupSong('Bohemian Rhapsody', 'Queen');
    expect(result).not.toBeNull();
    expect(result.title).toBeDefined();
    expect(result.artist).toBeDefined();
    expect(result.source).toMatch(/^(itunes|deezer)$/);
  }, 15000);

  test('lookupSong returns default for empty input', async () => {
    const result = await lookupSong('', '');
    expect(result.title).toBe('Unknown');
    expect(result.artist).toBe('Unknown');
    expect(result.source).toBeNull();
  });

  // --- Cache Tests ---

  test('lookupSong caches results', async () => {
    // First call — hits API
    const result1 = await lookupSong('Blinding Lights', 'The Weeknd');
    expect(cache.size).toBe(1);

    // Second call — hits cache (should be instant)
    const start = Date.now();
    const result2 = await lookupSong('Blinding Lights', 'The Weeknd');
    const elapsed = Date.now() - start;

    expect(result2.title).toEqual(result1.title);
    expect(elapsed).toBeLessThan(50); // Cache should be near-instant
  }, 15000);

  test('cache key is case-insensitive', async () => {
    await lookupSong('blinding lights', 'the weeknd');
    expect(cache.has('the weeknd|blinding lights')).toBe(true);
  }, 10000);
});
