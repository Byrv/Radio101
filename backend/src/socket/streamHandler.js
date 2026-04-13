const config = require('../config');
const { setState, getState } = require('../routes/nowPlaying');
const { lookupSong } = require('../services/musicLookup');

let listenerCount = 0;
const listeners = new Set();
let djSocketId = null;

function initStreamHandler(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // --- DJ Events ---

    socket.on('dj:start', ({ djSecret }) => {
      if (djSecret !== config.djSecret) {
        socket.emit('error', { message: 'Invalid DJ secret' });
        return;
      }
      djSocketId = socket.id;
      setState({ live: true });
      io.to('radio').emit('stream:status', {
        live: true,
        listenerCount,
      });
      console.log('🎙️ DJ started broadcasting');
    });

    socket.on('dj:audio-chunk', (chunk) => {
      if (socket.id !== djSocketId) return;
      socket.to('radio').emit('stream:audio-chunk', chunk);
    });

    socket.on('dj:now-playing', async ({ title, artist }) => {
      if (socket.id !== djSocketId) return;
      console.log(`🎵 Now playing request: ${artist} - ${title}`);

      let metadata;
      try {
        metadata = await lookupSong(title, artist);
      } catch (err) {
        console.error('Song lookup error:', err);
        metadata = { title, artist, album: null, albumArt: null, songUrl: null, source: null };
      }
      setState(metadata);
      io.to('radio').emit('stream:now-playing', metadata);
      console.log('🎵 Metadata resolved:', JSON.stringify(metadata));
    });

    socket.on('dj:stop', () => {
      if (socket.id !== djSocketId) return;
      djSocketId = null;
      setState({ live: false, title: null, artist: null, album: null, albumArt: null, songUrl: null });
      io.to('radio').emit('stream:status', { live: false, listenerCount });
      console.log('🛑 DJ stopped broadcasting');
    });

    // --- Listener Events ---

    socket.on('listener:join', () => {
      socket.join('radio');
      listeners.add(socket.id);
      listenerCount = listeners.size;
      socket.emit('stream:now-playing', getState());
      socket.emit('stream:status', { live: getState().live, listenerCount });
      io.to('radio').emit('stream:status', { live: getState().live, listenerCount });
      console.log(`👤 Listener joined. Count: ${listenerCount}`);
    });

    socket.on('disconnect', () => {
      if (socket.id === djSocketId) {
        djSocketId = null;
        setState({ live: false });
        io.to('radio').emit('stream:status', { live: false, listenerCount });
        console.log('🎙️ DJ disconnected');
      }
      if (listeners.has(socket.id)) {
        listeners.delete(socket.id);
        listenerCount = listeners.size;
        io.to('radio').emit('stream:status', { live: getState().live, listenerCount });
      }
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initStreamHandler };
