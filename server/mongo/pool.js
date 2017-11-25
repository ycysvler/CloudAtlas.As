let baseSchemas = require('./baseschemas');
let entSchemas = require('./entschemas');
let haSchemas = require('./haschemas');
const pool = new Map();

let getMongoPool = (entid)=>{
    entid = entid === undefined ? "cabase":entid;

    if(!pool.has(entid)){
        if(entid === 'ha'){
            let schemas = new haSchemas();
            pool.set(entid, schemas);
        }
       else if(entid === 'cabase'){
           let schemas = new baseSchemas();
           pool.set(entid, schemas);
       }else{
           let schemas = new entSchemas(entid);
           pool.set(entid, schemas);
       }
    }
    let db = pool.get(entid);

    return db;
}

module.exports = getMongoPool;