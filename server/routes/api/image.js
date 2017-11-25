/**
 * Created by VLER on 2017/8/8.
 */
let multiparty = require('multiparty');
let moment = require('moment');
let uuid = require('uuid');
var path = require('path');
let fs = require('fs');

let getMongoPool = require('../../mongo/pool');

module.exports = function (router) {
    // 旧实现，暂留
    router.get('/enterprises/:entid/images', (req, res, next) => {
        let entid = req.params.entid;
        let Image = getMongoPool(entid).Image;
        Image.find(function (err, items) {
            res.json(items);
        });
    });
    // 旧实现，暂留
    router.get('/enterprises/:entid/images/:image', (req, res, next) => {
        let entid = req.params.entid;
        let Image = getMongoPool(entid).Image;
        Image.findOne({image: req.params.image}, function (err, item) {
            res.json(item);
        });
    });
    // 旧实现，暂留
    router.post('/enterprises/:entid/images', (req, res, next) => {
        let entid = req.params.entid;
        let Image = getMongoPool(entid).Image;

        var form = new multiparty.Form({uploadDir: './public/upload/'});

        form.parse(req, function (err, fields, files) {

            var resolvepath;

            for (var name in files) {
                let item = files[name][0];
                resolvepath = path.resolve(item.path);
            }

            let file = path.resolve(resolvepath);
            fs.readFile(file, function (err, chunk) {
                if (err)
                    return console.error(err);

                let item = new Image();
                item.createtime = new moment();
                item.source = chunk;
                // 如果有类型和扩展信息，那就加上吧
                item.type = fields.type ? fields.type[0] : null;
                item.extend = fields.extend ? fields.extend[0] : null;

                item.save(function (err, item) {
                    fs.unlink(file, () => {
                    });
                    res.send(200, true);
                });
            });
        });
    });


    // PaaS -> 图像上传
    router.post('/images', (req, res, next) => {
        let entid = req.ent.entid;
        let Image = getMongoPool(entid).Image;

        var form = new multiparty.Form({uploadDir: './public/upload/'});

        form.parse(req, function (err, fields, files) {
            if (fields.type) {
                var resolvepath;
                var originalFilename;

                for (var name in files) {
                    let item = files[name][0];

                    resolvepath = path.resolve(item.path);

                    originalFilename = item.originalFilename;
                }

                let file = path.resolve(resolvepath);
                fs.readFile(file, function (err, chunk) {
                    if (err)
                        return console.error(err);

                    let item = new Image();
                    item.createtime = new moment();
                    item.name = originalFilename;
                    item.source = chunk;
                    // 如果有类型和扩展信息，那就加上吧
                    item.type = fields.type ? fields.type[0] : null;
                    item.extend = fields.extend ? fields.extend[0] : null;
                    item.state = 0; //新图像

                    item.save(function (err, item) {
                        fs.unlink(file, () => {
                        });

                        if(err){res.send(500, err.errmsg);}
                        else{res.send(200, true);}
                    });
                });
            } else {
                res.send(400, '[type] parameter is missing');
            }
        });

    });
    // PaaS -> 分配类型
    router.put('/images/:name/type', (req, res, next) => {
        // connect 使用 appid 换算出 entid
        let entid = req.ent.entid;
        let name = req.params.name;
        let type = req.body.type;

        let Image = getMongoPool(entid).Image;
        let ImageType = getMongoPool(entid).ImageType;

        Image.findOne({name:name},'name type', function(err, img){
            if(img){
                // 图像存在
                if(img.type === type){
                    // 类型没有变化，什么都不用做
                }
                else {
                    // 原索引做删除处理
                    ImageType.findOneAndUpdate({name:name,type:img.type},{state:-1},(err,item)=>{});

                    ImageType.findOne({name:name,type:type},(err,item)=>{
                        if(item){
                            // 以前就是这个分类的
                            ImageType.findOneAndUpdate({name:name,type:type},{state:0},(err,item)=>{});

                        }else{

                            //ImageType.find()
                        }
                    });
                }
            }
        });

        // 假设从 7 -> 9
        // 查索引7，索引9
        // 如果7存在，state改成-1
        // 如果9存在，state改成0
        // 如果9不存在，新增索引

        Image.findOneAndUpdate({name: name}, {type: type}, function (err, item) {
            res.send(200, true);
        });
    });
    // PaaS -> 分配扩展信息
    router.put('/images/:name/extend', (req, res, next) => {
        // connect 使用 appid 换算出 entid
        let entid = req.ent.entid;
        let name = req.params.name;
        let extend = req.body.extend;

        /* 待实现 */
        Image.findOneAndUpdate({name: name}, {extend: extend}, function (err, item) {
            res.send(200, true);
        });
    });
    // PaaS -> 查询 -> 按名称查询单条信息
    router.get('/images/:name/info', (req, res, next) => {
        // connect 使用 appid 换算出 entid
        let entid = req.ent.entid;
        let name = req.params.name;
        let Image = getMongoPool(entid).Image;
        Image.findOne({name: name}, function (err, item) {
            res.json(item);
        });
    });
    // PaaS -> 获取图像数据
    router.get('/images/:name',(req, res, next) =>{
        // connect 使用 appid 换算出 entid
        let entid = req.ent.entid;
        let name = req.params.name;
        let Image = getMongoPool(entid).Image;
        Image.findOne({name: name}, 'source', function (err, item) {
            res.send(item.source);
        });
    });
    // PaaS -> 查询 -> 按类型查询
    router.get('/images/:type/:pagesize/:pageindex', (req, res, next) => {
        // connect 使用 appid 换算出 entid
        let entid = req.ent.entid;
        let type = req.params.type;
        let pagesize = req.params.pagesize;
        let pageindex = req.params.pageindex;
        let Image = getMongoPool(entid).Image;

        /* 待实现 */
    });
    // PaaS -> 删除 -> 按名称
    router.delete('/images/:name', (req, res, next) => {
        // connect 使用 appid 换算出 entid
        let entid = req.ent.entid;
        let name = req.params.name;
        let Image = getMongoPool(entid).Image;
        let ImageIndex = getMongoPool(entid).ImageIndex;

        // 查一下对应的索引，如果存在，state 改成 -1
        ImageIndex.findOneAndUpdate({name: name}, {type: -1}, function (err, item) {
        });

        Image.remove({name: name}, function (err, item) {
            if (err) return handleError(err);
            res.send(200, true);
        });

    });
    // PaaS -> 删除 -> 按分类 (这个功能，在删除类型里面实现)


}
