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
        const milliseconds = item.time * 1000;
        const dateObject = new Date(milliseconds);
        // eslint-disable-next-line max-len
        const humanDateFormat = dateObject.toLocaleString(); // 2019-12-9 10:30:15
        const date = humanDateFormat.split(',')[0];
        const monthYear = date.split('/')[0] + '/' + date.split('/')[2];
        emit(doc.data.escrowInfo.ownerAddr+':date', date);
        emit(doc.data.escrowInfo.ownerAddr+':month', monthYear);
      });
};

// reducer: count
