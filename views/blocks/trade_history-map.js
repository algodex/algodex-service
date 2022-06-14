module.exports = function(doc) {
// Source: http://code.google.com/p/gflot/source/browse/trunk/flot/base64.js?r=153
// Cached-Source: https://gist.github.com/AndreasMadsen/2693051

/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
    * Version: 1.0
    * LastModified: Dec 25 1999
    * This library is free.  You can redistribute it and/or modify it.
    */
const atob = function(target) {
    const base64DecodeChars = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
    ];

    /**
     * @param {string} str
     * @return {string}
     */
    function base64decode(str) {
    let c1; let c2; let c3; let c4;
    let i; let out;

    const len = str.length;
    i = 0;
    out = '';
    while (i < len) {
        /* c1 */
        do {
        c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c1 === -1);
        if (c1 === -1) {
        break;
        }

        /* c2 */
        do {
        c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c2 === -1);
        if (c2 === -1) {
        break;
        }

        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

        /* c3 */
        do {
        c3 = str.charCodeAt(i++) & 0xff;
        if (c3 === 61) {
            return out;
        }
        c3 = base64DecodeChars[c3];
        } while (i < len && c3 === -1);
        if (c3 === -1) {
        break;
        }

        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

        /* c4 */
        do {
        c4 = str.charCodeAt(i++) & 0xff;
        if (c4 === 61) {
            return out;
        }
        c4 = base64DecodeChars[c4];
        } while (i < len && c4 === -1);
        if (c4 === -1) {
        break;
        }
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
    }

    return base64decode(target);
};

const getOwner = function(group, appCallType, isAlgoBuyEscrow) {
    if (appCallType === 'open') {
    return group[0].txn.snd;
    } else if (appCallType === 'close') {
    return group[group.length - 1].txn.snd;
    } else if (appCallType === 'execute_with_closeout' && isAlgoBuyEscrow) {
    return group[group.length - 1].txn.arcv;
    } else if (appCallType === 'execute_with_closeout' && !isAlgoBuyEscrow) {
    return group[group.length - 1].txn.close;
    }

    return null;
};

const getAlgodexExecuteGroups = (groups) => {
    const executeGroups = groups.filter( (group) => {
    return group.filter( (txn) => {
        if (txn.txn && txn.txn.type) {
        const isAlgodex = ( txn.txn.apid === 22045503 ||
            txn.txn.apid === 22045522);
        if (txn.txn.type === 'appl' && isAlgodex) {
            const isAlgoBuyEscrow = txn.txn.apid === 22045503;
            const appCallType = atob(txn.txn.apaa[0]);
            if (appCallType === 'open' || appCallType === 'close') {
            // Do nothing as we are only tracking when escrows open or close
            return false;
            }
            return true;
        }
        return false;
        }
    }).length > 0;
});
    return executeGroups
}
// Map Function
if (typeof doc.txns !== 'undefined') {
    const allGroups = doc.txns.reduce((allGroups, txn) => {
    const txnGroup = txn.txn.grp;
    if (txnGroup === undefined) {
        return allGroups;
    }

    const groupTxnArr = (allGroups[txnGroup] || []);
    groupTxnArr.push(txn);
    allGroups[txnGroup] = groupTxnArr;
    return allGroups;
    }, {});

    const executeGroups = getAlgodexExecuteGroups(Object.values(allGroups));
    
    executeGroups.forEach( (group) => {
        let algoAmount = -1;
        let asaAmount = -1;

        let assetSellerAddr = "UNKNOWN";
        let assetBuyerAddr =  "UNKNOWN";
        let asaId = -1;
        let executeType = 'UNKNOWN';
        
        group.forEach( (txn) => {
        if (txn.txn && txn.txn.type) {
            if (txn.txn.type === 'appl') {
                const isAlgoBuyEscrow = txn.txn.apid === 22045503;
                executeType = atob(txn.txn.apaa[0]);
            }
            if (!txn['txn']['grp']) {
                return;
            }
            if (txn['txn']['type'] == 'appl') {
                //log->debug("application txn");
            } else if (txn['txn']['type'] == 'pay' && algoAmount == -1
                && (txn['txn']['amt']) && txn['txn']['amt'] > 0) {

                //log->debug("pay");
                algoAmount = txn['txn']['amt'] || 0;
                assetSellerAddr = txn['txn']['rcv'] || "NA";

            } else if (txn['txn']['type'] == 'axfer' && asaAmount == -1
                && (txn['txn']['aamt']) && txn['txn']['aamt'] > 0) {
                asaAmount = txn['txn']['aamt'] || 0;
                asaId = txn['txn']['xaid'];
                assetBuyerAddr = txn['txn']['arcv'];

                //log->debug("axfer asaAmount asaId");
            }

            }
        });
        
        emit(doc._id, {
        algoAmount,
        asaAmount,
        assetSellerAddr,
        assetBuyerAddr,
        asaId,
        executeType
        })
    });
    }
}