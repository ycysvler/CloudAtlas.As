let multiparty = require('multiparty');
let moment = require('moment');
let Redis = require('ioredis');
let uuid = require('uuid');
let path = require('path');
let fs = require('fs');
let async = require("async");
let rediscfg = require('../../config/redis');

let getMongoPool = require('../../mongo/pool');

let redis = new Redis(rediscfg);

module.exports = function (router) {

    // PaaS -> 查询任务列表
    router.get('/job/:entid', (req, res, next) => {
        let entid = req.params.entid;

        let Job = getMongoPool(entid).Job;

        Job.find().sort('-createtime').exec(function (err, items) {
            res.json(items);
        });
    });
    // PaaS -> 查询任务详情
    router.get('/job/:id', (req, res, next) => {

    });
    // PaaS -> 查询进度
    router.get('/job/:id/progress', (req, res, next) => {

    });

    // PaaS -> 查询结果
    router.get('/job/:id/images', (req, res, next) => {

    });


}