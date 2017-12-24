var mongodbconfig = require('../config/mongodb');
var mongoose = require('mongoose');

module.exports = class Schemas{
    constructor(entid){
        let uri = mongodbconfig.uri + entid;
        let conn = mongoose.createConnection(uri, mongodbconfig.options);

        conn.then(function(db) {
            console.log("ent mongodb connected!");
        });

        this.imageSchema = new mongoose.Schema({
            name: {type: String,index: {unique: true, dropDups: true}},       // 图片名称
            type: {type: String,index: true},       // 业务类型
            colour:{type: Number,index: true},      // 业务类型
            state:{type: Number,index: true},       // 状态 0:新图，1:正在计算特征，2：计算特征成功，-1：计算特征失败
            source:Buffer,                          //  原始图像
            shape_cut:Buffer,                       //  形状归一图
            color_cut:Buffer,                       //  颜色归一图
            color_feature:Buffer,                   //  颜色特征
            lbp_feature:Buffer,                     //  纹理特征
            shape_feature:Buffer,                   //  形状特征
            deep_feature:Buffer,                    //  深度学习特征
            extend:String,                          //  扩展字段，放个大字符串
            createtime:Date                         //  创建时间
        });
        this.Image = conn.model('Image', this.imageSchema);

        this.imageTypeSchema = new mongoose.Schema({
            name: {type: String,index: {unique: true, dropDups: true}}, // 类型名称
            code: {type: String,index: {unique: true, dropDups: true}}, // 类型编号
            order:{type: Number},                                       // 类型排序
            description:String,                                         // 描述信息
            createtime:Date                                             // 创建时间
        });
        this.ImageType = conn.model('ImageType', this.imageTypeSchema);

        this.imageIndexSchema = new mongoose.Schema({
            name: {type: String},                    // 图片名称
            type: {type: String,index: true},       // 业务类型
            index: {type: Number,index: true},      // 索引号
            state:{type:Number, index:true}         // 0 可用，-1 不可用
        });
        this.imageIndexSchema.index({ type: 1, index: 1 });
        this.imageIndexSchema.index({ type: 1, state: 1 });
        this.ImageIndex = conn.model('ImageIndex', this.imageIndexSchema);

        this.imageIndexFileSchema = new mongoose.Schema({
            file_name: {type: String,index: {unique: true, dropDups: true}},  // 图片名称
            type: String,                           // 业务类型
            feature_type: String,                   // 查询的特征类型
            count:Number,
            index:Number,
            version: String,                        // 查询的特征类型
        });
        this.ImageIndexFile = conn.model('ImageIndexFile', this.imageIndexFileSchema);

        this.jobSchema = new mongoose.Schema({
            name: {type: String},                   // 任务名称
            imagetypes: [String],                   // 查询的图片类型
            images: [String],                       // 查询的图片类型
            jobtype: Number,                        // 0 快速查询， 1 高级查询， 2 局部查询
            featuretypes: [String],                 // 查询的特征类型
            progress:Number,
            state:{type:Number, index:true},        // 0 等待，1 正在执行， 2 执行结束
            resultcount:Number,                     // 用户想要多少个结果（一共）
            createtime:Date                         // 创建时间
        });

        this.Job = conn.model('Job', this.jobSchema);

        this.jobFastBlockSchema = new mongoose.Schema({
            jobid:{type: String,index: true},
            image:String,                           // 查询的图片类型
            file_name: String,                      // 索引文件名
            type: String,                           // 查询的图片类型
            feature_type: String,                   // 查询的特征类型
            count:Number,
            index:Number,
            resultcount:Number,                     // 用户想要多少个结果（每个block）
            state:{type:Number, index:true},        // 0 等待，1 正在执行， 2 执行结束
            createtime:Date                         // 创建时间
        });

        this.jobFastBlockSchema.index({ jobid: 1, state: 1 });
        this.jobFastBlockSchema.index({ jobid: 1, file_name: 1 });
        this.JobFastBlock = conn.model('JobFastBlock', this.jobFastBlockSchema);

        this.jobSeniorBlockSchema = new mongoose.Schema({
            jobid:{type: String,index: true},
            image:String,                           // 查询的图片类型
            type: String,                           // 查询的图片类型
            skip:Number,                            // 查询区间起始点
            limit:Number,                           // 查询区间长度
            resultcount:Number,                     // 用户想要多少个结果（每个block）
            state:{type:Number, index:true},        // 0 等待，1 正在执行， 2 执行结束
            createtime:Date                         // 创建时间
        });

        this.JobSeniorBlock = conn.model('JobSeniorBlock', this.jobSeniorBlockSchema);

        this.jobZoneBlockSchema = new mongoose.Schema({
            jobid:{type: String,index: true},
            image:String,                           // 查询的图片类型
            type: String,                           // 查询的图片类型
            skip:Number,                            // 查询区间起始点
            limit:Number,                           // 查询区间长度
            resultcount:Number,                     // 用户想要多少个结果（每个block）
            state:{type:Number, index:true},        // 0 等待，1 正在执行， 2 执行结束
            createtime:Date                         // 创建时间
        });

        this.JobZoneBlock = conn.model('JobZoneBlock', this.jobZoneBlockSchema);

        this.jobResultSchema = new mongoose.Schema({
            jobid: {type: String,index: true},  // 任务ID
            source:String,                      // 搜索图片
            imagetype: String,                  // 查询的图片类型
            featuretype: String,                // 查询的特征类型
            image: String,                      // 搜索结果
            score: Number,                      // 相似度
            extend:String,                      // 扩展内容
            createtime:Date                     // 创建时间
        });

        this.jobResultSchema.index({ jobid: 1, imagetype: 1 });
        this.jobResultSchema.index({ jobid: 1, source:1, imagetype: 1,featuretype:1 });
        this.JobResult = conn.model('JobResult', this.jobResultSchema);
    }
}

