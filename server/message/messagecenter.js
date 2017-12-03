var moment = require('moment');

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