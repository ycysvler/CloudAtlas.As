var Redis = require('ioredis');
var rediscfg = require('../server/config/redis');
var redis = new Redis(rediscfg);
var pub = new Redis(rediscfg);

pub.publish('Search:ProgressChange', JSON.stringify({ progress: 0.99,
    entid: 'ent_20170808220894',
    jobid: '5a424b978d86cc738cab2931' }));

