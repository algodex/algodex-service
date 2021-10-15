const os = require('os');

const createConsecutiveArray = function (start=0, length) {
    let arr = new Array(length-start)
    let idx = start;
    for (let i = 0; i < arr.length; i++) {
        arr[i] = idx;
        idx++;
    }
    return arr;
};

const createConsecutiveObject = function(start, length){
    return createConsecutiveArray(start, length)
        .reduce((previousValue, currentValue)=>{
            previousValue[currentValue] = true;
            return previousValue;
        }, {});
}

const cpuChunkArray = function (arr) {
    let chunks = [];
    let chunk = arr.length / os.cpus().length;
    for (let i = 0, l = arr.length; i < l; i += chunk) {
        chunks.push(arr.slice(i, i + chunk));
    }
    return chunks;
};

module.exports = {
    cpuChunkArray,
    createConsecutiveArray,
    createConsecutiveObject,
}