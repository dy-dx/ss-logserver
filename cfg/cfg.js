var cfg = {
  // UDP server port
  port: process.env.PORT || 8006
  // Redis Info
, redis_host: process.env.REDIS_HOST || '127.0.0.1'
, redis_port: parseInt(process.env.REDIS_PORT, 10) || 8005
, redis_db: parseInt(process.env.REDIS_DB, 10) || 0
, redis_password: process.env.REDIS_PASSWORD
};

module.exports = cfg;
