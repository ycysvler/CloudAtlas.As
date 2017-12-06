let multiparty = require('multiparty');
let moment = require('moment');
let Redis = require('ioredis');
let uuid = require('uuid');
let path = require('path');
let fs = require('fs');
let async = require("async");
let rediscfg = require('../../config/redis');

let getMongoPool = require('../../mongo/pool');

let redis = new Redis(rediscfg);

function resImageName(Image,id, res, times){
    if(times > 10){
        res.send(500,'feature error');
    }else{
        Image.findOne({_id: id}, 'name, deep_feature', function (err, item) {
            if(item.deep_feature === undefined){
                setTimeout(()=>{resImageName(Image, id, res, times+1)}, 500);
            }else{
                res.send(200, {name: item.name});
            }
        });
    }
}

module.exports = function (router) {

    // PaaS -> 图片上传
    router.post('/search/images', (req, res, next) => {
        let entid = req.ent.entid;

        let Image = getMongoPool(entid).Image;

        var form = new multiparty.Form({uploadDir: './public/upload/'});

        form.parse(req, function (err, fields, files) {

            var resolvepath;
            var originalFilename;

            for (var name in files) {
                let item = files[name][0];

                resolvepath = path.resolve(item.path);
                originalFilename = item.originalFilename;
            }

            let file = path.resolve(resolvepath);
            fs.readFile(file, function (err, chunk) {
                if (err) {
                    res.send(500, err.errmsg);
                } else {
                    let item = new Image();
                    item.createtime = new moment();
                    //path.extname
                    let extname = path.extname(originalFilename);
                    item.name = uuid.v1() + extname;
                    item.source = chunk;
                    // 如果有类型和扩展信息，那就加上吧
                    item.type = 'search';    // 这是一个用于查询的图像
                    item.state = 0;         // 0:新图，1:正在计算特征，2：计算特征成功，-1：计算特征失败

                    item.save(function (err, item) {
                        fs.unlink(file, () => {
                        });

                        if (err) {
                            res.send(500, err.errmsg);
                        }
                        else {
                            var msg = {name: item.name, type: 'search', entid: entid};
                            redis.publish('Feature:BuildFeature', JSON.stringify(msg));

                            resImageName(Image, item._id, res, 0);


                        }
                    });
                }
            });
        });
    });

    // PaaS -> 新建查询
    router.post('/search', (req, res, next) => {
        let entid = req.ent.entid;
        let Job = getMongoPool(entid).Job;

        console.log(req.body);

        if (!req.body.imagetypes || req.body.imagetypes.length == 0) {
            res.send(400, '[imagetypes] parameter is missing');
        } else if (!req.body.images || req.body.images.length == 0) {
            res.send(400, '[images] parameter is missing');
        } else {
            let imagetypes = req.body.imagetypes;
            let images = req.body.images;
            let featuretypes = req.body.featuretypes ? req.body.featuretypes : ["deep"];
            /* 待实现 */
            let item = new Job();
            item.name = req.body.name;
            item.imagetypes = imagetypes;
            item.images = images;
            item.resultcount = 10;
            item.state = 0;
            item.featuretypes = featuretypes;
            item.createtime = new moment();
            item.save(function (err, job) {
                if (err) {
                    res.json(500, err.errmsg);
                }
                else {
                    let ImageIndexFile = getMongoPool(entid).ImageIndexFile;
                    ImageIndexFile.find()
                        .where('type').in(imagetypes)
                        .where('feature_type').in(featuretypes)
                        .exec(function (err, items) {
                            // 相关的索引文件搞到了
                            blockCreate(entid,job._id,images,items,item.resultcount / 2,
                                function(error, blocks){
                                    // 通知新查询任务产生
                                    redis.publish('Search:NewJob', JSON.stringify({jobid: job._id,entid:entid}));
                                    res.json(200, {id: job._id});
                                });
                        });
                }
            });
        }
    });

    function blockCreate(entid,jobid, images, files,resultcount,callback) {
        var blocks = [];
        for (var i = 0; i < images.length; i++) {
            var image = images[i];
            for (var j = 0; j < files.length; j++) {
                var file = files[j];
                var block = {
                    jobid: jobid,
                    image: image,
                    file_name: file.file_name,
                    type: file.type,
                    resultcount:resultcount,
                    feature_type: file.feature_type,
                    count: file.count,
                    index: file.index,
                    state: 0,
                    createtime: new moment()
                };
                blocks.push(block);
            }
        }
        let JobBlock = getMongoPool(entid).JobBlock;
        async.map(blocks, function (item, callback) {
                JobBlock.create(item, function (err, block) {
                    callback(null, block.file_name);
                })
            },
            function (err, datas) {
                callback(err, datas);
            });
    }
    // PaaS -> 查询任务列表
    router.get('/search', (req, res, next) => {

    });
    // PaaS -> 查询任务详情
    router.get('/search/:id', (req, res, next) => {

    });
    // PaaS -> 查询进度
    router.get('/search/:id/progress', (req, res, next) => {

    });

    // PaaS -> 查询结果
    router.get('/search/:id/images', (req, res, next) => {

    });


}