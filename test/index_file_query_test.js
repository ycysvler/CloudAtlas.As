let getMongoPool = require('../server/mongo/pool');
let ImageIndexFile = getMongoPool('ent_20170808220894').ImageIndexFile;

ImageIndexFile.find()
    .where('type').in(['test','test1'])
    .where('feature_type').in(['deep','test1'])
    .exec(function(err,items){
    console.log(items);
});
