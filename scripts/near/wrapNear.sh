#!/bin/bash

if [[ "$1" -eq "testnet" ]]
then 
    env NEAR_ENV=testnet near call v2.wnear.flux-dev near_deposit "{}" --accountId $2 --amount $3 --gas=300000000000000
fi