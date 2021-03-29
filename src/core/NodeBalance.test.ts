import Big from 'big.js';
import NodeBalance from './NodeBalance';

describe('NodeBalance', () => {
    describe('hasEnoughBalanceForStaking', () => {
        it('should return false when node has not enough balance for staking', () => {
            const stake = new NodeBalance({
                stakePerRequest: new Big(100),
                contractIds: [],
                providersConfig: [],
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(50));

            expect(stake.hasEnoughBalanceForStaking('test')).toBe(false);
        });

        it('should return false when node has not enough balance for staking', () => {
            const stake = new NodeBalance({
                stakePerRequest: new Big(100),
                contractIds: [],
                providersConfig: [],
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(150));

            expect(stake.hasEnoughBalanceForStaking('test')).toBe(true);
        });
    });

    describe('withdrawBalanceToStake', () => {
        it('should return 0 when there is not enough balance to stake', () => {
            const stake = new NodeBalance({
                stakePerRequest: new Big(200),
                contractIds: [],
                providersConfig: [],
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(150));
            const withdrawn = stake.withdrawBalanceToStake('test');

            expect(withdrawn.toString()).toBe('0');
            expect(stake.balances.get('test')?.toString()).toBe('150');
        });

        it('should return the stake amount and reduce the balance', () => {
            const stake = new NodeBalance({
                stakePerRequest: new Big(200),
                contractIds: [],
                providersConfig: [],
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(1000));

            const withdrawn = stake.withdrawBalanceToStake('test');

            expect(withdrawn.toString()).toBe('200');
            expect(stake.balances.get('test')?.toString()).toBe('800');
        });

    });
});