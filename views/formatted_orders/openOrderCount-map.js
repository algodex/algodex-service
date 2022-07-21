// @ts-nocheck


module.exports = function(doc) {
  doc.data.history
      .filter(item => {
        // first epoch
        // eslint-disable-next-line no-undef
        log(item); return item.time >= 1629950400 && item.time <= 1644469199;
      })
      .filter(item => (item.algoAmount && item.algoAmount > 0) ||
      (item.asaAmount && item.asaAmount > 0))
      .forEach(item => {
        emit(doc.data.escrowInfo.ownerAddr, 1);
      });
};

// reduer: _count
