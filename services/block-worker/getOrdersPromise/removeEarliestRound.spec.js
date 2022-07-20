const removeEarliestRound = require('./removeEarliestRound');

it('removes round keys and invalid data', () => {
  const vals = [
    {value: {
      round: 417,
      earliestRound: 410,
      otherData: 'some data',
    }},
    {value: {
      round: 417,
      earliestRound: 415,
      otherData: 'some data2',
    }},
    {value: {
      round: 417,
      earliestRound: 570,
      otherData: 'some data3',
    }},
  ];
  const afterRemoval = removeEarliestRound(vals, 417);
  expect(afterRemoval).toEqual([
    {value: {
      otherData: 'some data',
    }},
    {value: {
      otherData: 'some data2',
    }},

  ]);
});

