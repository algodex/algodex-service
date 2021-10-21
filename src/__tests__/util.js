const os = require('os');
const {InvalidParameter} = require('../Errors');
const {
  createConsecutiveArray,
  createConsecutiveObject,
  cpuChunkArray,
} = require('../util');

describe('Utility Suite', ()=>{
  test('create consecutive items in an array', async () => {
    expect(()=>{
      createConsecutiveArray(5, 4);
    }).toThrowError(InvalidParameter);

    const arry = createConsecutiveArray(10, 15);
    expect(arry.length).toEqual(5);
  });

  test('create consecutive keys of an object', ()=>{
    expect(()=>{
      createConsecutiveObject(5, 4);
    }).toThrowError(InvalidParameter);

    const obj = createConsecutiveObject(10, 15);
    expect(Object.keys(obj).length).toEqual(5);
  });

  test('chunk array by CPU cores', ()=>{
    expect(()=>{
      cpuChunkArray('fail');
    }).toThrowError(InvalidParameter);

    const arry = cpuChunkArray(createConsecutiveArray(10, 15));
    expect(arry.length).toEqual(os.cpus().length);
  });
});
