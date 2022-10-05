#!/bin/bash
cargo build --release
for i in {1..33}
do
  target/release/rewards-calc --epoch=$i --debug=0
done

