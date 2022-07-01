
const getOwnerBalanceDataToHist = (ownerBalanceData) => {
    throw 'PLEASE IMPLEMENT';
  
    return ownerBalanceData.rows.reduce( (ownerToHist, row) => {
      const owner = row;
      return ownerToHist;
    }, {});
  };

module.exports = getOwnerBalanceDataToHist;
