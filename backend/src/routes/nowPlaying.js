const express = require('express');
const router = express.Router();

// In-memory state (will be populated by socket handler)
let currentState = {
  live: false,
  title: null,
  artist: null,
  album: null,
  albumArt: null,
  songUrl: null,
  listenerCount: 0,
};

// Getter/setter for shared state
const getState = () => currentState;
const setState = (newState) => {
  currentState = { ...currentState, ...newState };
};

// GET /api/now-playing
router.get('/now-playing', (req, res) => {
  res.json(getState());
});

module.exports = router;
module.exports.getState = getState;
module.exports.setState = setState;
