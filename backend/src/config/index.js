require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  djSecret: process.env.DJ_SECRET || 'default-secret',
};
