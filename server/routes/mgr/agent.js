let moment = require('moment');
let Redis = require('ioredis');
let uuid = require('uuid');
let path = require('path');
let getMongoPool = require('../../mongo/pool');

module.exports = function (router) {

    // PaaS -> 重建索引 0：全量重建，1：增量重建
    router.get('/agents', (req, res, next) => {
        let Agent = getMongoPool('ha').Agent;
        let Instance = getMongoPool('ha').Instance;

        Agent.find(function (err, ags) {
            Instance.find(function(err, ins){
                var result = [];
                for(var akey in ags){
                    var agent = JSON.parse( JSON.stringify( ags[akey]));

                    agent.instances = [];

                    for(var ikey in ins){
                        var instance =JSON.parse( JSON.stringify(ins[ikey])) ;
                        if(instance.agentid == agent.agentid){
                            instance.time = null;
                            instance.badge = -1;    // -1 未知， 0 正常， 1 超过5秒无心跳， 2 超过1分钟无心跳

                            // 心跳数据
                            if(global.heartbeats.hasOwnProperty(instance.instanceid)){
                                instance.time = global.heartbeats[instance.instanceid];
                                let heart = moment(instance.time);
                                let now = moment();
                                let seconds = now.diff(heart, 'seconds');

                                instance.badge = 0;
                                if(seconds>5){
                                    instance.badge = 1;
                                }
                                if(seconds>60){
                                    instance.badge = 2;
                                }
                            }

                            instance.state = "";
                            // 状态数据
                            if(global.states.hasOwnProperty(instance.instanceid)){
                                instance.state = global.states[instance.instanceid];
                            }

                            agent.instances.push(instance);

                        }
                    }
                    result.push(agent);
                }
                res.json(result);
            });

        });
    });
}