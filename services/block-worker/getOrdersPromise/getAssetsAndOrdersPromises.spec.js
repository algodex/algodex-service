/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const getAssetsAndOrdersPromises = require('./getAssetsAndOrdersPromises');
const QueueMock = require('../../../src/__mocks__/QueueMock');

const blockData = {
  rnd: 555,
};
const rows = [
  {
    'key': [
      '3UZRRBPLSK3LGRUF6GQFCLOU6QVFV3KMFE5BPKIK7SALY5LZPJGJUAVQFQ',
    ],
    'value': {
      'isAlgoBuyEscrow': false,
      'type': 'close',
      'orderInfo': '1-449-0-15322902',
      'numerator': 1,
      'assetId': 15322902,
      'denominator': 449,
      'minimum': 0,
      'price': 449,
      'ownerAddr': 'ZM4OVTFEW5NVM5O7PXPQE7YJ6JFCOKMDEO3BA7RZL4VD5MJS3P4ZGS2E6M',
      'block': '16583486',
      'ts': 1631352746,
      'version': '\u0003',
      'status': 'closed',
    },
  },
  {
    'key': [
      'SGKHJD4H5VO5H2SDADDPJ32MXUBEDZYZTOSFPVHGXRHDLWEQUZ47UFNXNA',
    ],
    'value': {
      'isAlgoBuyEscrow': true,
      'type': 'open',
      'orderInfo': '1-320-0-15322902',
      'numerator': 1,
      'assetId': 15322902,
      'denominator': 320,
      'minimum': 0,
      'price': 320,
      'ownerAddr': 'LRVOVB6VEEAFNBSUKLNY6SD643P5JSK3NZ75BVFH7YJA2XU7WXVZFYVGWA',
      'block': '16583500',
      'ts': 1631352805,
      'version': '\u0003',
      'status': 'open',
    },
  },
];

it('gets asset and orders promises', async () => {
  const input = {
    queues: {
      orders: Object.create(QueueMock),
      assets: Object.create(QueueMock),
    },
    validRows: rows,
    blockData,
  };
  const promises = getAssetsAndOrdersPromises(input);
  const results = await Promise.all(promises);

  expect(results).toEqual(['added', 'added', 'added', 'added']);
  expect(QueueMock.add.mock.calls).toEqual([
    [
      'assets',
      {
        'assetId': 15322902,
      },
      {
        'removeOnComplete': true,
      },
    ],
    [
      'orders',
      {
        'account': '3UZRRBPLSK3LGRUF6GQFCLOU6QVFV3KMFE5BPKIK7SALY5LZPJGJUAVQFQ',
        'blockData': {
          'rnd': 555,
        },
        'reducedOrder': {
          'key': [
            '3UZRRBPLSK3LGRUF6GQFCLOU6QVFV3KMFE5BPKIK7SALY5LZPJGJUAVQFQ',
          ],
          'value': {
            'isAlgoBuyEscrow': false,
            'type': 'close',
            'orderInfo': '1-449-0-15322902',
            'numerator': 1,
            'assetId': 15322902,
            'denominator': 449,
            'minimum': 0,
            'price': 449,
            'ownerAddr': 'ZM4OVTFEW5NVM5O7PXPQE7YJ6JFCOKMDEO3BA7RZL4VD5MJS3P4ZGS2E6M',
            'block': '16583486',
            'ts': 1631352746,
            'version': '\u0003',
            'status': 'closed',
          },
        },
      },
      {
        'removeOnComplete': true,
      },
    ],
    [
      'assets',
      {
        'assetId': 15322902,
      },
      {
        'removeOnComplete': true,
      },
    ],
    [
      'orders',
      {
        'account': 'SGKHJD4H5VO5H2SDADDPJ32MXUBEDZYZTOSFPVHGXRHDLWEQUZ47UFNXNA',
        'blockData': {
          'rnd': 555,
        },
        'reducedOrder': {
          'key': [
            'SGKHJD4H5VO5H2SDADDPJ32MXUBEDZYZTOSFPVHGXRHDLWEQUZ47UFNXNA',
          ],
          'value': {
            'isAlgoBuyEscrow': true,
            'type': 'open',
            'orderInfo': '1-320-0-15322902',
            'numerator': 1,
            'assetId': 15322902,
            'denominator': 320,
            'minimum': 0,
            'price': 320,
            // eslint-disable-next-line max-len
            'ownerAddr': 'LRVOVB6VEEAFNBSUKLNY6SD643P5JSK3NZ75BVFH7YJA2XU7WXVZFYVGWA',
            'block': '16583500',
            'ts': 1631352805,
            'version': '\u0003',
            'status': 'open',
          },
        },
      },
      {
        'removeOnComplete': true,
      },
    ],
  ]);
});
