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
        //console.log('%s\t%s\t %s', channel, new moment().format('HH:mm:ss'), JSON.stringify(message));
        logChange(message);
    } else if (channel === 'Search:ProgressChange') {
        //console.log('%s\t%s\t %s',channel, new moment().format('HH:mm:ss'),message);
        progressChange(message);
    } else if(channel === 'Search:Complete'){
        console.log('%s\t%s\t %s',channel, new moment().format('HH:mm:ss'),message);
        // 查询任务完成
        searchComplete(message);
    }
}

function progressChange(message) {
    var data = {progress: message.progress, jobid: message.jobid};
    // 未完成
    getCallbackUrl(message.entid,(url)=>{
        progressChangeProgress(url + "?type=progress", data);
    });
}
function searchComplete(message) {
    var data = {progress: message.progress, jobid: message.jobid};
    getCallbackUrl(message.entid,(url)=>{
        jobComplete(url , message.entid, message.jobid, data);
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

    console.log('job complete', jobid);

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
                    // 通知进度100%
                    progressChangeProgress(url + "?type=progress", data);
                }
            );
        })
}

function getCallbackUrl(entid, cb) {
    let self = this;
    if (self.ents) {
        if (self.ents[entid]) {
            cb(self.ents[entid]);
        }
    } else {
        self.ents = {};
        // 这里只会执行一次
        Enterprise.find(function (err, items) {
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                self.ents[item.entid] = item.cbaddress;
            }
            cb(self.ents[entid]);
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