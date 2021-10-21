const {DexError} = require('../errors/index');
const InvalidParameter = require('../errors/InvalidParameter');
const getMessage = require('../message');

describe('Message Suite', ()=>{
  test('create message', ()=>{
    // Create Message
    const msg = getMessage({
      name: 'TestMessage',
      description: 'A test message',
    });
    expect(msg).toEqual({
      'description': 'A test message',
      'name': 'TestMessage',
      'type': 'message',
    });
  });
  test('required validation', ()=>{
    // Test required
    expect(()=>{
      getMessage({name: 'Missing Description Error'});
    }).toThrowError(InvalidParameter);
  });
  test('message is throwable', ()=>{
    const msg = getMessage({
      name: 'TestError',
      description: 'A test error for message creation',
    });
    expect(()=>{
      throw new DexError(msg);
    }).toThrowError(/A test error for message creation/);
  });
});
