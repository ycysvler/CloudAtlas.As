var moment = require('moment');
let getMongoPool = require('../mongo/pool');
let request = require('request');
let Enterprise = getMongoPool().Enterprise;

module.exports = function (channel, message){
    // 收到消息啦
    message = JSON.parse(message);
    //console.log('%s\t%s\t %s',channel, new moment().format('HH:mm:ss'), JSON.stringify(message));
    if(channel === 'HeartBeat:TimeChange'){
        heartBeatChange(message);
    }else if(channel === 'State:StateChange'){
        stateChange(message);
    }else if(channel === 'Log'){
        logChange(message);
    }else if(channel === 'Search:ProgressChange'){
        progressChange(message);
    }else{

    }
}

function progressChange(message) {
    var data = {progress:message.progress, jobid:message.jobid};
    getCallbackUrl(message.entid, (url)=>{
        url = url + "?type=progress";
        request({
            url: url,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body:data// JSON.stringify(data)
        }, function(error, response, body) {
            console.log('error', error);
            if (!error && response.statusCode == 200) {
            }
        });
    });

}

function getCallbackUrl(entid, cb) {
    let self = this;
    if(self.ents){
        if(self.ents[entid]){
            cb(self.ents[entid].cbaddress);
        }
    }else{
        Enterprise.find(function(err, items){
            console.log(items);
            for(let i=0;i<items.length;i++){
                let item = items[i];
                self.ents = {};
                self.ents[item.entid]=item;
            }
            cb(self.ents[entid].cbaddress);
        });
    }
}

function heartBeatChange(message) {
    global.heartbeats[message.instanceid] = message.time;
}

function stateChange(message){
    global.states[message.instanceid] = message;
}

function logChange(message){
    if(!global.index){
        global.index = 0;
    }else if(global.index > 999999){
        global.index = 0;
    }
    global.index++;

    message.index = global.index;

    global.logs.unshift(message);
}