/**
 * Created by VLER on 2017/8/8.
 */

let getMongoPool = require('../../mongo/pool');

let Enterprise = getMongoPool().Enterprise;
let uuid = require('uuid');
let moment = require('moment');

module.exports = function (router) {
    router.route('/enterprises')
        .get(function (req, res, next) {
            Enterprise.find(function(err, items){
                res.json(items);
            });
        });

    router.route('/enterprises/:name')
        .get(function (req, res, next) {
            Enterprise.findOne({entname:req.params.name},function(err, item){
                res.json(item);
            });
        });

    router.post('/enterprises', (req, res, next)=> {
        let item = new Enterprise(req.body);
        item.entid = "ent_" + (new moment()).format('YYYYMMDDHHMMSS');
        item.appid = uuid.v1();
        item.createtime = new moment();
        item.save(function(err, item){
            res.json(item);
        });
    });

    router.delete('/enterprises/:id',(req, res, next)=>{
        Enterprise.remove({ "entid":req.params.id }, function (err) {
            if (err) return handleError(err);
            res.send(200,true);
        });
    });
}