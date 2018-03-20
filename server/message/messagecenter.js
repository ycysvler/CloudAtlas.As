var moment = require('moment');
let getMongoPool = require('../mongo/pool');
let request = require('request');
let async = require("async");
let Enterprise = getMongoPool().Enterprise;

module.exports = function (channel, message) {
    // 收到消息啦
    message = JSON.parse(message);

    //console.log('%s\t%s\t %s',channel, new moment().format('HH:mm:ss'), JSON.stringify(message));
    if(channel === 'Feature:BuildFeature'){
        console.log('%s\t%s\t %s',channel, new moment().format('HH:mm:ss'),message);
    }else if (channel === 'HeartBeat:TimeChange') {
        heartBeatChange(message);
    } else if (channel === 'State:StateChange') {
        stateChange(message);
    } else if (channel === 'Log') {
        console.log('%s\t%s\t %s', channel, new moment().format('HH:mm:ss'), JSON.stringify(message));
        logChange(message);
    } else if (channel === 'Search:ProgressChange') {
        progressChange(message);
    } else {

    }
}

function progressChange(message) {
    var data = {progress: message.progress, jobid: message.jobid};

    getCallbackUrl(message.entid, (url) => {
        console.log('progress', data.progress);
        if (data.progress < 1) {
            // 未完成
            progressChangeProgress(url + "?type=progress", data);
        } else {
            // 完成
            jobComplete(url , message.entid, message.jobid, data);
        }
    });
}

function progressChangeProgress(url, data) {
    request({
        url: url,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: data// JSON.stringify(data)
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
        }
    });
}

function jobComplete(url, entid, jobid, data) {
    let JobResult = getMongoPool(entid).JobResult;

    JobResult.find({
            jobid: jobid
        },
        function (errr, items) {

            async.map(items,
                (item, callback) => {
                    var block = {
                        jobid: jobid,
                        image: item.image,
                        typeid: item.imagetype,
                        score:item.score,
                        featuretype:item.featuretype,
                        createtime: new moment()
                    };

                    console.log('complete', item);

                    request({
                        url: url+ "?type=complete",
                        method: "POST",
                        json: true,
                        headers: {
                            "content-type": "application/json",
                        },
                        body: block// JSON.stringify(data)
                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            callback(null, block);
                        }
                    });
                },
                (err, datas) => {
                    // 通知新查询任务产生
                    progressChangeProgress(url + "?type=progress", data);
                }
            );
        })
}

function getCallbackUrl(entid, cb) {
    let self = this;
    if (self.ents) {
        if (self.ents[entid]) {
            cb(self.ents[entid].cbaddress);
        }
    } else {
        Enterprise.find(function (err, items) {
            console.log(entid, items);
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                self.ents = {};
                self.ents[item.entid] = item;
            }
            console.log(entid, self.ents);
            cb(self.ents[entid].cbaddress);
        });
    }
}

function heartBeatChange(message) {
    global.heartbeats[message.instanceid] = message.time;
}

function stateChange(message) {
    global.states[message.instanceid] = message;
}

function logChange(message) {
    if (!global.index) {
        global.index = 0;
    } else if (global.index > 999999) {
        global.index = 0;
    }
    global.index++;

    message.index = global.index;

    global.logs.unshift(message);
}