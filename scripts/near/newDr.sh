TIME=`date +%s`
MULTIPLIER=1000
ACCOUNT_ID=franklinwaller2.testnet

END_TIME=`expr $TIME - 1000`
END_TIME=`expr $END_TIME \* $MULTIPLIER`

MINUS_BEGIN_TIME=`expr 1000 \* $MULTIPLIER`
BEGIN_TIME=`expr $END_TIME - $MINUS_BEGIN_TIME`

SOURCES="[{ \"source_path\": \"0.4\", \"end_point\": \"https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=$BEGIN_TIME&endTime=$END_TIME&limit=1\" }]"
JSON="{\"sources\": $SOURCES,\"tags\":[\"1\"],\"description\":\"What is the price of BTC?\",\"challenge_period\":\"120000000000\",\"settlement_time\":\"1\",\"data_type\":{\"Number\":\"10000000000\"},\"creator\":\"requestor-contract.flux-dev\"}"

env NEAR_ENV=testnet near call requestor-contract.flux-dev create_data_request "{\"amount\": \"1000000000000000000000000\", \"payload\": $JSON}" --accountId $ACCOUNT_ID --amount 0.000000000000000000000001 --gas=300000000000000
