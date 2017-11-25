var Redis = require('ioredis');
var rediscfg = require('./server/config/redis');
var redis = new Redis(rediscfg);
var pub = new Redis(rediscfg);

redis.subscribe('news', 'music','RebuildIndex','Config','HeartBeat:TimeChange', function (err, count) {
    // Now we are subscribed to both the 'news' and 'music' channels.
    // `count` represents the number of channels we are currently subscribed to.

    pub.publish('news', 'Hello world!');
    pub.publish('music', 'Hello again!');
});

redis.on('message', function (channel, message) {
    // Receive message Hello world! from channel news
    // Receive message Hello again! from channel music
    console.log('Receive message %s from channel %s', message, channel);
});