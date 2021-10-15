module.exports = function (doc) {
    crypto = require('views/lib/crypto');
    if(typeof doc['apps-local-state'] !== 'undefined'){
        doc['apps-local-state'].forEach((state)=>{
            if(typeof state['key-value'] !== 'undefined'){
                state['key-value'].forEach((kv)=>{
                    key = crypto(kv.key, 'aota');
                    if (key !== 'creator' && key !== 'version') {
                        parts = key.split(/^(\d+)-(\d+)-(\d+)-(\d+)$/);
                        emit(parts[4], {
                            orderInfo: kv.key,
                            numerator: parseInt(parts[1]),
                            denominator: parseInt(parts[2]),
                            minimum: parseInt(parts[3]),
                            assetId: parseInt(parts[4])
                        });
                    }
                });
            }
        })
    }
}
