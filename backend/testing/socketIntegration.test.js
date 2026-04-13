const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

// We need a fresh streamHandler for each test suite
// so re-require it in isolation
describe('Socket.IO Stream Handler', () => {
  let io, httpServer;
  let listenerSocket;
  const TEST_PORT = 3099;
  const DJ_SECRET = 'test-secret';

  beforeAll((done) => {
    // Override DJ secret for tests
    process.env.DJ_SECRET = DJ_SECRET;
    process.env.PORT = String(TEST_PORT);

    // Clear module cache to get fresh streamHandler
    jest.resetModules();
    const { initStreamHandler } = require('../src/socket/streamHandler');

    httpServer = http.createServer();
    io = new Server(httpServer, {
      cors: { origin: '*' },
      transports: ['websocket'],
    });
    initStreamHandler(io);

    httpServer.listen(TEST_PORT, () => {
      listenerSocket = Client(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
      });
      listenerSocket.on('connect', done);
    });
  });

  afterAll((done) => {
    listenerSocket.close();
    io.close();
    httpServer.close(done);
  });

  test('listener can join radio room and receive status', (done) => {
    listenerSocket.emit('listener:join');
    listenerSocket.once('stream:status', (data) => {
      expect(data).toHaveProperty('live');
      expect(data).toHaveProperty('listenerCount');
      expect(data.listenerCount).toBeGreaterThanOrEqual(1);
      done();
    });
  });

  test('invalid DJ secret is rejected', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`, {
      transports: ['websocket'],
    });
    djSocket.on('connect', () => {
      djSocket.emit('dj:start', { djSecret: 'wrong' });
      djSocket.on('error', (err) => {
        expect(err.message).toBe('Invalid DJ secret');
        djSocket.close();
        done();
      });
    });
  });

  test('DJ can start broadcasting with valid secret', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`, {
      transports: ['websocket'],
    });
    djSocket.on('connect', () => {
      djSocket.emit('dj:start', { djSecret: DJ_SECRET });
      // Listener should receive status update
      listenerSocket.once('stream:status', (data) => {
        expect(data.live).toBe(true);
        // Stop broadcasting for cleanup
        djSocket.emit('dj:stop');
        setTimeout(() => {
          djSocket.close();
          done();
        }, 100);
      });
    });
  });

  test('audio chunks are relayed from DJ to listeners', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`, {
      transports: ['websocket'],
    });
    djSocket.on('connect', () => {
      // Ensure listener is in room
      listenerSocket.emit('listener:join');

      setTimeout(() => {
        djSocket.emit('dj:start', { djSecret: DJ_SECRET });

        setTimeout(() => {
          const testChunk = Buffer.from('fake-audio-data');
          djSocket.emit('dj:audio-chunk', testChunk);

          listenerSocket.once('stream:audio-chunk', (chunk) => {
            expect(chunk).toBeDefined();
            djSocket.emit('dj:stop');
            setTimeout(() => {
              djSocket.close();
              done();
            }, 100);
          });
        }, 200);
      }, 100);
    });
  }, 10000);

  test('DJ stop broadcasts offline status', (done) => {
    const djSocket = Client(`http://localhost:${TEST_PORT}`, {
      transports: ['websocket'],
    });
    djSocket.on('connect', () => {
      djSocket.emit('dj:start', { djSecret: DJ_SECRET });

      setTimeout(() => {
        djSocket.emit('dj:stop');

        listenerSocket.once('stream:status', (data) => {
          expect(data.live).toBe(false);
          djSocket.close();
          done();
        });
      }, 200);
    });
  });
});
