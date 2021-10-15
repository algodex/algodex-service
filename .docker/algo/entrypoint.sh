#!/usr/bin/env bash

./goal node start -d $ALGORAND_DATA

# Catchpoints:
# Testnet: https://algorand-catchpoints.s3.us-east-2.amazonaws.com/channel/testnet/latest.catchpoint
# Mainnet: https://algorand-catchpoints.s3.us-east-2.amazonaws.com/channel/mainnet/latest.catchpoint

./goal node catchup 17240000#ANXS5ZTSXG7MOGLJIISRTAQE5V45XTYEDSMSALKFMQQ5QYDELIBQ -d $ALGORAND_DATA

./goal node status -w 1000

#./carpenter -d $ALGORAND_DATA