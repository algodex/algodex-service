#!/bin/bash
for i in {1..40}
do
  target/release/rewards-calc --epoch=$i
done

