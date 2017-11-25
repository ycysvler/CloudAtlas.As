let moment = require('moment');
let Redis = require('ioredis');
let uuid = require('uuid');
let path = require('path');
let rediscfg = require('../../config/redis');

let getMongoPool = require('../../mongo/pool');

let pub = new Redis(rediscfg);

module.exports = function (router) {

    // PaaS -> 重建索引 0：全量重建，1：增量重建
    router.post('/indexs', (req, res, next) => {
        let entid = req.ent.entid;

        let msg = req.body;
        msg.entid = entid;

        console.log('image_types',req.body.types);

        // 这里面应该检查一下，客户端是否指定重建那个type的索引，如果没有指定，那就是全量类型，在这里补全；
        if(!req.body.imageTypes){
            let ImageType = getMongoPool(entid).ImageType;
            // 查找所有code
            ImageType.find({},{_id:0}).select('code').exec(function (err, items) {
                msg.imageTypes = items;
                pub.publish('Index:RebuildIndex', JSON.stringify(msg));
                res.send(200, true);
            });
        }else{
            pub.publish('Index:RebuildIndex', JSON.stringify(msg));
            res.send(200, true);
        }
    });
}