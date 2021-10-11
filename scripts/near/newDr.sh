TIME=`date +%s`
END_TIME=`expr $TIME - 600`
BEGIN_TIME=`expr $END_TIME - 1200`
SOURCES="[{ \"source_path\": \"0.close\", \"end_point\": \"https://api.coinpaprika.com/v1/coins/btc-bitcoin/ohlcv/historical?start=$BEGIN_TIME&end=$END_TIME\" }, { \"end_point\": \"https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=$BEGIN_TIME&to=$END_TIME\", \"source_path\": \"prices[\$\$last][1]\" }]"
JSON="{\"sources\": $SOURCES,\"tags\":[\"1\"],\"description\":\"What is the price of BTC?\",\"challenge_period\":\"120000000000\",\"settlement_time\":\"1\",\"data_type\":{\"Number\":\"10000000000\"},\"creator\":\"requestor-contract.flux-dev\"}"
env NEAR_ENV=testnet near call requestor-contract.flux-dev create_data_request "{\"amount\": \"1000000000000000000000000\", \"payload\": $JSON}" --accountId $1 --amount 0.000000000000000000000001 --gas=300000000000000
