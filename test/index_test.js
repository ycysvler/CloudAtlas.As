var Redis = require('ioredis');
var rediscfg = require('../server/config/redis');
var redis = new Redis(rediscfg);
var pub = new Redis(rediscfg);

// 订阅通道RebuildIndex
redis.subscribe('Index:RebuildIndex', function (err, count) {
    pub.publish('news', 'Hello world!');
    pub.publish('music', 'Hello again!');
});

redis.on('message', function (channel, message) {
    console.log('Receive message %s from channel %s', message, channel);
});