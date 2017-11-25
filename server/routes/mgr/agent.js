let moment = require('moment');
let Redis = require('ioredis');
let uuid = require('uuid');
let path = require('path');
let getMongoPool = require('../../mongo/pool');

module.exports = function (router) {

    // PaaS -> 重建索引 0：全量重建，1：增量重建
    router.get('/agents', (req, res, next) => {
        let Agent = getMongoPool('ha').Agent;

        Agent.find(function (err, items) {
            res.json(items);
        });
    });


}