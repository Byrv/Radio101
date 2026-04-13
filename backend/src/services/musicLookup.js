async function lookupSong(title, artist) {
  if (!title && !artist) {
    return getDefault(title, artist);
  }

  const cacheKey = `${(artist || '').toLowerCase()}|${(title || '').toLowerCase()}`;

  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📀 Cache hit: ${cacheKey}`);
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  // Try iTunes first
  try {
    const result = await lookupFromItunes(title, artist);
    if (result) {
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.error('iTunes lookup failed:', err.message);
  }

  // Fallback to Deezer
  try {
    const result = await lookupFromDeezer(title, artist);
    if (result) {
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.error('Deezer lookup failed:', err.message);
  }

  // Both failed — return basics
  const fallback = getDefault(title, artist);
  cache.set(cacheKey, { data: fallback, timestamp: Date.now() });
  return fallback;
}

// In-memory cache: { "artist|title": { data, timestamp } }
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * iTunes Search API (free, no key)
 * Endpoint: https://itunes.apple.com/search?term={query}&media=music&limit=1
 */
async function lookupFromItunes(title, artist) {
  const query = encodeURIComponent(`${artist || ''} ${title || ''}`.trim());
  if (!query) return null;

  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`iTunes HTTP ${response.status}`);

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const track = data.results[0];
    return {
      title: track.trackName || title,
      artist: track.artistName || artist,
      album: track.collectionName || null,
      albumArt: track.artworkUrl100
        ? track.artworkUrl100.replace('100x100', '600x600')
        : null,
      songUrl: track.trackViewUrl || null,
      source: 'itunes',
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Deezer Search API (free, no key)
 * Endpoint: https://api.deezer.com/search?q={query}&limit=1
 */
async function lookupFromDeezer(title, artist) {
  const query = encodeURIComponent(`${artist || ''} ${title || ''}`.trim());
  if (!query) return null;

  const url = `https://api.deezer.com/search?q=${query}&limit=1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Deezer HTTP ${response.status}`);

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return null;
    }

    const track = data.data[0];
    return {
      title: track.title || title,
      artist: track.artist?.name || artist,
      album: track.album?.title || null,
      albumArt: track.album?.cover_xl || track.album?.cover_big || null,
      songUrl: track.link || null,
      source: 'deezer',
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function getDefault(title, artist) {
  return {
    title: title || 'Unknown',
    artist: artist || 'Unknown',
    album: null,
    albumArt: null,
    songUrl: null,
    source: null,
  };
}

module.exports = { lookupSong, lookupFromItunes, lookupFromDeezer, cache };
