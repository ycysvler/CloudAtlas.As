/**
 * Created by VLER on 2017/8/8.
 */

// let User = require('../../mongo/schemas').User;

let moment = require('moment');
let uuid = require('uuid');

let getMongoPool = require('../../mongo/pool');

let User = getMongoPool().User;

module.exports = function (router) {
    router.get('/users', (req, res, next) => {
        console.log('entid:', req.entid);
        User.find(function (err, items) {
            res.json(items);
        });
    });

    router.get('/users/:mobile', (req, res, next) => {
        User.findOne({mobile: req.params.mobile}, function (err, item) {
            res.json(item);
        });
    });

    router.post('/users', (req, res, next) => {
        let item = new User(req.body);
        item.userid = uuid.v1();
        item.createtime = new moment();
        item.save(function (err, item) {
            res.json(item);
        });
    });

    router.put('/users/:id/enterprise', function (req, res, next) {
        User.findOneAndUpdate({userid: req.params.id}, req.body, function (err, item) {
            res.send(200, true);
        });
    });

    /* delete user. */
    router.delete('/users/:id', (req, res, next) => {
        User.remove({userid: req.params.id}, function (err) {
            if (err) return handleError(err);
            res.send(200, true);
        });
    });
}