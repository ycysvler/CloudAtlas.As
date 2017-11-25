var mongodbconfig = require('../config/mongodb');
var mongoose = require('mongoose');

module.exports = class Schemas{
    constructor(){
        let uri = mongodbconfig.uri + 'cabase';
        let conn = mongoose.createConnection(uri, mongodbconfig.options);

        conn.then(function(db) {
            console.log("base mongodb connected!");
        });

        this.userSchema = new mongoose.Schema({
            userid: {type: String,index: true},     // 用户ID
            mobile: {type: String,index: true},     // 手机号
            password: String,                       // 密码
            entid:{type: String,index: true},       // 企业ID
            createtime:Date                         // 创建时间
        });

        this.enterpriseSchema = new mongoose.Schema({
            entid: {type: String,index: true},      // 企业ID
            entname: String,                        // 企业名称
            createtime:Date,                        // 创建时间
            adminid:String,                         // 管理员ID
            ips:Array,                              // IP 白名单
            appid:{type:String, index:true}        // 唯一开发ID
        });

        this.configSchema = new mongoose.Schema({
            package: {type: String,index: {unique: true, dropDups: true}},   // 包名
            version: {type: String},                // 版本
            content:{type: String},                 // 配置内容
            createtime:Date                         // 创建时间
        });

        this.User = conn.model('User', this.userSchema);
        this.Enterprise =  conn.model('Enterprise', this.enterpriseSchema);
        this.Config =  conn.model('Config', this.configSchema);
    }


}

