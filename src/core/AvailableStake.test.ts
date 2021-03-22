import Big from 'big.js';
import { NetworkType } from '../models/NearNetworkConfig';
import AvailableStake from './AvailableStake';

describe('AvailableStake', () => {
    describe('hasEnoughBalanceForStaking', () => {
        it('should return false when node has not enough balance for staking', () => {
            const stake = new AvailableStake({
                stakePerRequest: new Big(100),
                accountId: '',
                contractIds: [],
                credentialsStorePath: '',
                maximumChallengeRound: 1,
                net: NetworkType.Testnet,
            }, {} as any, {} as any);

            stake.balance = new Big(50);

            expect(stake.hasEnoughBalanceForStaking()).toBe(false);
        });

        it('should return false when node has not enough balance for staking', () => {
            const stake = new AvailableStake({
                stakePerRequest: new Big(100),
                accountId: '',
                contractIds: [],
                credentialsStorePath: '',
                maximumChallengeRound: 1,
                net: NetworkType.Testnet,
            }, {} as any, {} as any);

            stake.balance = new Big(150);

            expect(stake.hasEnoughBalanceForStaking()).toBe(true);
        });
    });

    describe('withdrawBalanceToStake', () => {
        it('should return 0 when there is not enough balance to stake', () => {
            const stake = new AvailableStake({
                stakePerRequest: new Big(200),
                accountId: '',
                contractIds: [],
                credentialsStorePath: '',
                maximumChallengeRound: 1,
                net: NetworkType.Testnet,
            }, {} as any, {} as any);

            stake.balance = new Big(150);
            const withdrawn = stake.withdrawBalanceToStake();

            expect(withdrawn.toString()).toBe('0');
            expect(stake.balance.toString()).toBe('150');
        });

        it('should return the stake amount and reduce the balance', () => {
            const stake = new AvailableStake({
                stakePerRequest: new Big(200),
                accountId: '',
                contractIds: [],
                credentialsStorePath: '',
                maximumChallengeRound: 1,
                net: NetworkType.Testnet,
            }, {} as any, {} as any);

            stake.balance = new Big(1000);
            const withdrawn = stake.withdrawBalanceToStake();

            expect(withdrawn.toString()).toBe('200');
            expect(stake.balance.toString()).toBe('800');
        });

    });
});
