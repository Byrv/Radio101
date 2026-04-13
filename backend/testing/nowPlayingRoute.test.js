const { getState, setState } = require('../src/routes/nowPlaying');

describe('nowPlaying route state', () => {
  // Reset state before each test
  beforeEach(() => {
    setState({
      live: false,
      title: null,
      artist: null,
      album: null,
      albumArt: null,
      songUrl: null,
      listenerCount: 0,
    });
  });

  test('getState returns default state', () => {
    const state = getState();
    expect(state.live).toBe(false);
    expect(state.title).toBeNull();
    expect(state.listenerCount).toBe(0);
  });

  test('setState merges partial updates', () => {
    setState({ live: true, title: 'Test Song' });
    const state = getState();
    expect(state.live).toBe(true);
    expect(state.title).toBe('Test Song');
    expect(state.artist).toBeNull(); // unchanged
  });

  test('setState overwrites existing values', () => {
    setState({ title: 'Song A' });
    setState({ title: 'Song B' });
    expect(getState().title).toBe('Song B');
  });
});
