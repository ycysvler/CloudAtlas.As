let multiparty = require('multiparty');
let moment = require('moment');
let Redis = require('ioredis');
let uuid = require('uuid');
let path = require('path');
let fs = require('fs');
let async = require("async");
let rediscfg = require('../../config/redis');
var pub = new Redis(rediscfg);
let getMongoPool = require('../../mongo/pool');

function resImageName(Image, id, res, times) {
    if (times > 10) {
        res.send(500, 'feature error');
    } else {
        Image.findOne({_id: id}, 'name colour deep_feature', function (err, item) {
            if(item.colour === -1){
                res.send(200, {name: item.name});
            }else if (item.deep_feature === undefined) {
                setTimeout(() => {
                    resImageName(Image, id, res, times + 1)
                }, 1000);
            } else {
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


                            pub.publish('Log', JSON.stringify({ entid:entid,
                                level: 'DEBUG',
                                intance: 'CloudAtlas.As',
                                service:'search',
                                interface:'/search/images',
                                title:'上传搜索图片',
                                content:item.name,
                                time: new moment()
                            }));

                            pub.publish('Feature:BuildFeature', JSON.stringify(msg));



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

        // searchtype = 0 : 快速查询， 1：高级查询， 2：局部查询
        if (!req.body.imagetypes || req.body.imagetypes.length == 0) {
            res.send(400, '[imagetypes] parameter is missing');
        } else if (!req.body.images || req.body.images.length == 0) {
            res.send(400, '[images] parameter is missing');
        } else {
            let imagetypes = req.body.imagetypes;
            let images = req.body.images;
            let featuretypes = req.body.featuretypes ? req.body.featuretypes : ["deep"];
            let jobtype = req.body.jobtype ? parseInt(req.body.jobtype) : 0;    // 默认是快速查询
            let resultcount = req.body.resultcount ? parseInt(req.body.resultcount) : 100;    // 默认10条结果
            /* 待实现 */
            let item = new Job();
            item.name = req.body.name;
            item.imagetypes = imagetypes;
            item.images = images;
            item.jobtype = jobtype;
            item.resultcount = resultcount;
            item.state = 0;
            item.featuretypes = featuretypes;
            item.createtime = new moment();

            console.log('new job >', JSON.stringify(req.body));


            item.save(function (err, job) {
                if (err) {
                    res.json(500, err.errmsg);
                }
                else {
                    // 快速查询情况
                    if (jobtype === 0) {
                        Fast(res, entid, job._id, imagetypes, featuretypes, images, resultcount);
                    }
                    // 高级查询情况
                    if (jobtype === 1) {
                        Senior(res, entid, job._id, imagetypes, images, resultcount, true);
                    }
                    // 局部查询情况
                    if (jobtype === 2) {
                        // 最后一个字段true是高级，false是局部
                        Senior(res, entid, job._id, imagetypes, images, resultcount, false);
                    }
                }
            });
        }
    });

    function Fast(res, entid, jobid, imagetypes, featuretypes, images, resultcount) {
        let ImageIndexFile = getMongoPool(entid).ImageIndexFile;
        ImageIndexFile.find()
            .where('type').in(imagetypes)
            .where('feature_type').in(featuretypes)
            .exec(function (err, items) {
                // 相关的索引文件搞到了
                fastBlockCreate(entid, jobid, images, items, resultcount / 2,
                    function (error, blocks) {
                        // 通知新查询任务产生
                        pub.publish('Search:NewJob', JSON.stringify({jobid: jobid, entid: entid}));
                        res.json(200, {id: jobid});
                    });
            });
    }

    function Senior(res, entid, jobid, imagetypes, images, resultcount, isSenior) {
        let Image = getMongoPool(entid).Image;
        let JobBlock = isSenior? getMongoPool(entid).JobSeniorBlock:getMongoPool(entid).JobZoneBlock;

        async.map(imagetypes,
            (item, callback) => {
                Image.count({'type': item}, (err, data) => {
                    let result = [];
                    for (let key in images) {
                        let image = images[key];
                        // 有小数就 +1
                        let blocks = Math.ceil(data / 100);

                        for (var i = 0; i < blocks; i++) {
                            result.push({image: image, type: item, blocks: blocks, skip: i * 100, limit: 100});
                        }
                    }
                    callback(null, result);
                });
            },
            (err, datas) => {
                let items = [];
                for (var key in datas) {
                    items = items.concat(datas[key]);
                }

                async.map(items,
                    (item, callback) => {
                        var block = {
                            jobid: jobid,
                            image: item.image,
                            type: item.type,
                            skip: item.skip,
                            limit: item.limit,
                            resultcount: resultcount,
                            state: 0,
                            createtime: new moment()
                        };
                        JobBlock.create(block, function (err, block) {
                            callback(null, block);
                        });
                    },
                    (err, datas) => {
                        // 通知新查询任务产生
                        pub.publish('Search:NewJob', JSON.stringify({jobid: jobid, entid: entid}));
                        res.json(200, {id: jobid});
                    }
                );
            });
    }

    function fastBlockCreate(entid, jobid, images, files, resultcount, callback) {
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
                    resultcount: resultcount,
                    feature_type: file.feature_type,
                    count: file.count,
                    index: file.index,
                    state: 0,
                    createtime: new moment()
                };
                blocks.push(block);
            }
        }
        let JobBlock = getMongoPool(entid).JobFastBlock;
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
        let entid = req.ent.entid;
        let pageSize = parseInt(req.query.pagesize ? req.query.pagesize : 20);
        let pageIndex = parseInt(req.query.pageindex ? req.query.pageindex : 0);
        let name = req.query.name ? req.query.name : '';

        let Job = getMongoPool(entid).Job;

        let re = new RegExp(name);

        Job.where({'name': re}).count((err, count) => {
            Job.where({'name': re}).sort('-createtime').skip((pageIndex - 1) * pageSize).limit(pageSize).exec((err, items) => {
                let result = {
                    pagination: {total: count},
                    items: items
                };

                res.json(result);
            });
        });

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