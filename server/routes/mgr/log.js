let moment = require('moment');
let Redis = require('ioredis');
let uuid = require('uuid');
let path = require('path');

module.exports = function (router) {

    // PaaS -> 重建索引 0：全量重建，1：增量重建
    router.get('/logs/constantly', (req, res, next) => {
        sendLogs(res,0);
    });

    function sendLogs(res,i){
        i++;
        if(global.logs.length > 0) {
            res.write(JSON.stringify(global.logs));
            global.logs = [];
            res.end();
        } else if(i<5){
            setTimeout(function(){sendLogs(res,i)},1000);
        }else{
            res.json([]);
        }
    }
}