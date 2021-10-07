# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.3.0](https://github.com/fluxprotocol/oracle-bot/compare/v2.2.1...v2.3.0) (2021-10-07)


### Features

* **executor:** Retry a request when it was determined invalid (after a delay) ([c5079fa](https://github.com/fluxprotocol/oracle-bot/commit/c5079fa0f378c7b5a5abc946bc535fa2bac47c76))
* **near:** Update near provider to latest version (v2.3.0) ([f15bed0](https://github.com/fluxprotocol/oracle-bot/commit/f15bed0f195b3154cef0a04aac5b7fd9fd27e533))
* **near:** Update near provider to latest version (v2.3.1) ([b7bcf66](https://github.com/fluxprotocol/oracle-bot/commit/b7bcf669621c2a3792fa6cd17fb5996ebd616d46))
* **sync:** Skip requests that are ongoing at the time of sync ([cb7702a](https://github.com/fluxprotocol/oracle-bot/commit/cb7702a35f6d139dd31df850f8715830bc19e131))
* **walker:** Always try to finalize a request when possible ([fddfbb2](https://github.com/fluxprotocol/oracle-bot/commit/fddfbb28e588dabbd9731676d647dc8fa45e617a))

### [2.2.1](https://github.com/fluxprotocol/oracle-bot/compare/v2.2.0...v2.2.1) (2021-09-29)


### Bug Fixes

* **near:** Fix deprecation warnings ([9403063](https://github.com/fluxprotocol/oracle-bot/commit/94030637242611c0b5f92c43699f8cbef7ef11cd))

## [2.2.0](https://github.com/fluxprotocol/oracle-bot/compare/v2.1.0...v2.2.0) (2021-09-29)


### Features

* **log:** Remove unnecessary error logging ([e73ece5](https://github.com/fluxprotocol/oracle-bot/commit/e73ece54ef8ba27725b60b32747d06624b17b4c6))
* **node:** Add support for modules ([f92be4b](https://github.com/fluxprotocol/oracle-bot/commit/f92be4b66b294501f55853aa9fe37ce8cf49b3e1))

## [2.1.0](https://github.com/fluxprotocol/oracle-bot/compare/v2.0.1...v2.1.0) (2021-09-01)


### Features

* **outcome:** Fetches requests multiple times in order to check if an API is invalid or not ([64fa7b6](https://github.com/fluxprotocol/oracle-bot/commit/64fa7b64e1ffe8d9e16df57452dacd88ef0287bf))


### Bug Fixes

* **finalize:** Fix issue where an error in finalising could cause the node to stall for claiming ([a124872](https://github.com/fluxprotocol/oracle-bot/commit/a124872d8927643ed1581d869fe8f61157356429))
* **near:** Fix issue where a node would stall due not enough balance while it could resolve the request ([30a2056](https://github.com/fluxprotocol/oracle-bot/commit/30a2056525d07ef197aa1bcf97ac76085b8d6af6))
* **outcome:** Fix issue where answers where not counted correctly ([2928cd9](https://github.com/fluxprotocol/oracle-bot/commit/2928cd9c57e4f0fd6f76aac7c1101df9d49b7fb6))

### [2.0.1](https://github.com/fluxprotocol/oracle-bot/compare/v2.0.0...v2.0.1) (2021-08-31)


### Bug Fixes

* **near:** Fix issue where syncing would halt due not enough gas ([6f21ccf](https://github.com/fluxprotocol/oracle-bot/commit/6f21ccf257e7c3305af9a45bdd8de4e50a3ea5be))

## 2.0.0 (2021-08-30)


### ⚠ BREAKING CHANGES

* **near:** Removes NEAR_STAKE_AMOUNT in favour of NEAR_MAX_STAKE_AMOUNT

### Features

* Add ability to determine a request as invalid when a challenge is ongoing ([52c6622](https://github.com/fluxprotocol/oracle-bot/commit/52c6622495703102b33dc07038d693235171036b))
* Add ability to enable/disable debugging mode ([00f48b0](https://github.com/fluxprotocol/oracle-bot/commit/00f48b0215486164bb3a81cbe2cb003b0b7a2e44))
* Add ability to fetch average number of multiple sources ([6085699](https://github.com/fluxprotocol/oracle-bot/commit/6085699a54ed50a43bea89e9e4798ae9983dae1b))
* Add ability to resolve a data request ([8e76f2f](https://github.com/fluxprotocol/oracle-bot/commit/8e76f2f817ceaa296a63a9a3791aad45d99f32d5))
* Add ability to sync the node ([f83f6d9](https://github.com/fluxprotocol/oracle-bot/commit/f83f6d9829aa9aafc5e868194ca01a81e5605c0a))
* Add HTTP address for checking node health ([94a3342](https://github.com/fluxprotocol/oracle-bot/commit/94a334246b9891cb36ac771209139daa158f6494))
* Add permanent profit stats ([9620349](https://github.com/fluxprotocol/oracle-bot/commit/962034922e7e5d82a2321af2fa3fae0b7570ca2e))
* Add queueing system where only unique data requests are added ([3685c1f](https://github.com/fluxprotocol/oracle-bot/commit/3685c1f6bd3c106f5afba405ac9e16066e95ce1d))
* Add support for delayed requests using settlement_time ([a1a6a0a](https://github.com/fluxprotocol/oracle-bot/commit/a1a6a0af84e90b687e7b7dd61c4691ef49a2cc7e))
* Add support for private keys in config ([3c4e7af](https://github.com/fluxprotocol/oracle-bot/commit/3c4e7af199a6219cb2a7446658fefe1109fcb23a))
* Add tests ([7e5f715](https://github.com/fluxprotocol/oracle-bot/commit/7e5f7150555f7c129b3b0bfe9e095156d35e747c))
* Allow limiting the amount of contract ids to watch ([9d7bacd](https://github.com/fluxprotocol/oracle-bot/commit/9d7bacd39c8d544210a6697b17fc7a1c9cfa627a))
* **db:** Replace PouchDB with native LevelDB ([8afd8fb](https://github.com/fluxprotocol/oracle-bot/commit/8afd8fb7300cb32bf0cc46d43b6a0dee500b78c9))
* Delete data requests that are completed ([bd58ff2](https://github.com/fluxprotocol/oracle-bot/commit/bd58ff20b3bcd842f0e183547ac74f6ef04ca7fd))
* Gracefully exit in order to keep data integrity ([57365af](https://github.com/fluxprotocol/oracle-bot/commit/57365afc252cb76d3651f42a98febf3cefa1d846))
* Implement staking logic ([9bd55ad](https://github.com/fluxprotocol/oracle-bot/commit/9bd55ad443a9db19cf6f8e7e262cc700086af05c))
* Implement storage depositing for near ([f806219](https://github.com/fluxprotocol/oracle-bot/commit/f80621968a119094ca18ff4668fb53573f2c8326))
* Made database path and name configurable ([24671a9](https://github.com/fluxprotocol/oracle-bot/commit/24671a9a58d9cabbf0b9ca64e8761c303b4a6fab))
* Made use of providers instead of directly calling NEAR ([82fb67b](https://github.com/fluxprotocol/oracle-bot/commit/82fb67bea754e7c09075f6403fa71e016f473e29))
* Much simpler node design ([4493e1f](https://github.com/fluxprotocol/oracle-bot/commit/4493e1f9e1651410f9b301c1f6fd837c70fba205))
* **near:** Unstake any unbonded stake ([0e41dbd](https://github.com/fluxprotocol/oracle-bot/commit/0e41dbd0f4ef0cac93c7f34f77a86fb24a03ab03))
* **near:** Updated near to latest v2.0.0 ([fe56619](https://github.com/fluxprotocol/oracle-bot/commit/fe56619ceb6173ffeda4bf46cdd2a455d1b94169))
* Replace duplicate requests instead of discarding them ([d3f6921](https://github.com/fluxprotocol/oracle-bot/commit/d3f69214ede79f13db04e1055d623b3c0fb49777))
* Rewrote job search for future real time requests ([b0e2e87](https://github.com/fluxprotocol/oracle-bot/commit/b0e2e87191d6f38c6fca87cf51b99b4c1f0d5d06))
* Sort request pool based on fees ([725c2b7](https://github.com/fluxprotocol/oracle-bot/commit/725c2b78e27a626cd90f1904764ed2cd19de45cf))
* **system:** Stop job searcher when node is killed ([756a1af](https://github.com/fluxprotocol/oracle-bot/commit/756a1affa199343b0ddc8816b0d94fbd6f97f6c1))
* Use config.json instead of env variables ([197ab3e](https://github.com/fluxprotocol/oracle-bot/commit/197ab3ee0d11ce2f1d674dc9140026a88476b671))
* Use tokenContractId instead of sdkconfig for resolving data requests ([06cce37](https://github.com/fluxprotocol/oracle-bot/commit/06cce37a3ef3c64234eba65ad61f387e78a6b87c))
* **vm:** Add ability to resolve sources with magic paths ([24a4f0c](https://github.com/fluxprotocol/oracle-bot/commit/24a4f0c73d6ab8d84b95db7a970da91cef4df990))
* **vm:** Use stable VM version 1.1.0 ([76cd4ec](https://github.com/fluxprotocol/oracle-bot/commit/76cd4ec12e3136cd25ceebf4a1776d14c661186b))


### Bug Fixes

* **build:** Fix issue where CI could fail due out of sync packages ([20b2c9b](https://github.com/fluxprotocol/oracle-bot/commit/20b2c9b9ae932e2a50138fdfce915811e9a141b6))
* **env:** Fix issue with env example where NEAR_STAKE_AMOUNT comment crashed the node at start ([0371a06](https://github.com/fluxprotocol/oracle-bot/commit/0371a066b7e31a0034402601239e32ee361da8b2))
* Fix issue where after a sync it would not see the new data requests ([a797953](https://github.com/fluxprotocol/oracle-bot/commit/a7979537644a8b2fc0ce120a84d97b699908723e))
* Fix issue where processing ids could have a race condition on array indexes ([f301f63](https://github.com/fluxprotocol/oracle-bot/commit/f301f6329f59851c660951069de54dd7a87753a0))
* Fix tests for DataRequest ([aa30bcb](https://github.com/fluxprotocol/oracle-bot/commit/aa30bcb8a9591982ae34512efadb8aff84134dac))
* **request:** Fix issue where data request where mismatching outcomes ([b4756af](https://github.com/fluxprotocol/oracle-bot/commit/b4756af9203556a245fa63a3be9bfbc07c83a2f9))
