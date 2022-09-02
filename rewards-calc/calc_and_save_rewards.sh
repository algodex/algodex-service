#!/bin/bash
for i in {1..30}
do
  target/release/rewards-calc --epoch=$i
done

