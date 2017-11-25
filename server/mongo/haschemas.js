var mongodbconfig = require('../config/mongodb');
var mongoose = require('mongoose');

module.exports = class Schemas{
    constructor(){
        let uri = mongodbconfig.uri + 'ha';
        let conn = mongoose.createConnection(uri, mongodbconfig.options);

        conn.then(function(db) {
            console.log("ha mongodb connected!");
        });

        this.configSchema = new mongoose.Schema({
            package: {type: String,index: {unique: true, dropDups: true}},   // 包名
            version: {type: String},                // 版本
            content:{type: String},                 // 配置内容
            createtime:Date                         // 创建时间
        });

        this.Config =  conn.model('Config', this.configSchema,'config');

        this.serviceSchema = new mongoose.Schema({
            package: {type: String,index: {unique: true, dropDups: true}},   // 包名
            name: {type: String},                   // 服务名称
            directory:{type: String}                // 配置内容
        });

        this.Service =  conn.model('Service', this.configSchema,'service');

        this.agentSchema = new mongoose.Schema({
            ip: {type: String,index: {unique: true, dropDups: true}},   // 包名
            agentid: {type: String}                   // agentid
        });

        this.Agent =  conn.model('Agent', this.configSchema,'agent');
    }
}

