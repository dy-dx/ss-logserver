var dgram = require('dgram')
  , redis = require('redis')
  , npid = require('./lib/pid')
  , cfg = require('./cfg/cfg')
  , client = redis.createClient(cfg.redis_port, cfg.redis_host)
  , server = dgram.createSocket('udp4');

// Create a pidfile with the worker's ID and pid
try {
  npid.create(__dirname + '/worker-' + process.pid + '.pid', true);
} catch (err) {
  console.log(err);
  process.exit(1);
}

process.on('SIGTERM', exit);
process.on('SIGINT', exit);
// process.on('SIGKILL', exit); // This breaks in node v0.10.x

// This is for removing the pidfile when nodemon restarts due to changes
process.once('SIGUSR2', function() {
  npid.remove(__dirname + '/worker-' + process.pid + '.pid');
  process.nextTick(function() {
    process.kill(process.pid, 'SIGUSR2');
  });
});

function exit (code) {
  process.nextTick(function() {
    process.exit(code || 0);
  });
}


server.on('listening', function () {
  var address = server.address();
  console.log('UDP Server listening ' + address.address + ':' + address.port);
});

server.on('message', function (message, rinfo) {
  var key = 'sslog:' + rinfo.address + ':' + rinfo.port;

  client.multi()
    .lpush(key, message)
    .incr('counter:' + key)
    .exec(function (err, replies) {
      // if the counter value === 1, that means we weren't already processing
      //  dgrams from this address. So publish the event.
      if (replies && replies[1] === 1) {
        client.publish('logmessage', key, function (err) {
          if (err) {console.log(err);}
        });
      }
    });

});

server.bind(cfg.port);
