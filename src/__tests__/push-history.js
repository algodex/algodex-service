const pushHistory = require('../push-history');

const sampleHistory = [
  {
    'algoAmount': 1349000,
    'round': 16583614,
    'time': 1631353290,
  },
  {
    'algoAmount': 1349000,
    'round': 16583615,
    'time': 1631353293,
  },
  {
    'algoAmount': 1349000,
    'round': 16583617,
    'time': 1631353297,
  },
];

test('Can push history', (done) => {
  const history = [...sampleHistory];
  const data = {history};
  const entry = {
    'algoAmount': 1349000,
    'round': 16583630,
    'time': 1631353380,
  };

  pushHistory(data, entry);
  expect(data.history[history.length - 1]).toEqual(entry);
  done();
});

test('Duplicate entry is not added', (done) => {
  const history = [...sampleHistory];
  const data = {history};
  const initialLength = data.history.length;

  const entry = {
    'algoAmount': 1349000,
    'round': 16583617,
    'time': 1631353297,
  };
  pushHistory(data, entry);
  expect(data.history.length).toEqual(initialLength);
  done();
});

test('History is sorted correctly when adding earlier record', (done) => {
  const history = [...sampleHistory];
  const data = {history};

  const currentLastEntry = data.history[data.history.length - 1];
  const entry = {
    'algoAmount': 412312,
    'round': 15583617,
    'time': 1531353297,
  };
  pushHistory(data, entry);
  // Expect unchanged
  expect(data.history.length).toBe(4);
  expect(data.history[history.length - 1]).toEqual(currentLastEntry);
  expect(data.history[0]).toEqual(entry);
  done();
});

test('Unsorted history is sorted correctly', (done) => {
  const history = [
    {
      'algoAmount': 1349000,
      'round': 16583617,
      'time': 1631353297,
    },
    {
      'algoAmount': 1349000,
      'round': 16583615,
      'time': 1631353293,
    },

  ];
  const data = {history};
  pushHistory(data,
      {
        'algoAmount': 1349000,
        'round': 16583614,
        'time': 1631353290,
      },
  );

  expect(data.history).toEqual(sampleHistory);
  done();
});




