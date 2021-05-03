import Big from 'big.js';
import { parseNodeOptions } from '../models/NodeOptions';
import { createProviderMock } from '../test/mocks/ProviderMock';
import { createMockProviderRegistry } from '../test/mocks/ProviderRegistry';
import NodeBalance from './NodeBalance';

describe('NodeBalance', () => {

    describe('refreshBalances', () => {
        it('should refresh all provider balances that are available', async () => {
            const provider = createProviderMock('test');
            const providerRegistry = createMockProviderRegistry([provider]);
            providerRegistry.getTokenBalance = jest.fn(async () => new Big(100));

            const nodeBalance = new NodeBalance(parseNodeOptions({}), providerRegistry);

            expect(nodeBalance.balances.size).toBe(0);
            expect(nodeBalance.startingBalance.toString()).toBe('0');

            await nodeBalance.refreshBalances(false);

            expect(providerRegistry.getTokenBalance).toBeCalledTimes(1);
            expect(nodeBalance.startingBalance.toString()).toBe('0');

            expect(nodeBalance.balances.get('test')?.toString()).toBe('100');
            expect(nodeBalance.balances.size).toBe(1);
        });

        it('should set the starting balance when the isStartingBalance boolean is set to true', async () => {
            const provider = createProviderMock('test');
            const providerRegistry = createMockProviderRegistry([provider]);
            providerRegistry.getTokenBalance = jest.fn(async () => new Big(100));

            const nodeBalance = new NodeBalance(parseNodeOptions({}), providerRegistry);

            expect(nodeBalance.balances.size).toBe(0);
            expect(nodeBalance.startingBalance.toString()).toBe('0');

            await nodeBalance.refreshBalances(true);

            expect(providerRegistry.getTokenBalance).toBeCalledTimes(1);
            expect(nodeBalance.startingBalance.toString()).toBe('100');

            expect(nodeBalance.balances.get('test')?.toString()).toBe('100');
            expect(nodeBalance.balances.size).toBe(1);
        });

        it('should not fetch twice', async () => {
            const provider = createProviderMock('test');
            const providerRegistry = createMockProviderRegistry([provider]);
            providerRegistry.getTokenBalance = jest.fn(async () => new Big(100));

            const nodeBalance = new NodeBalance(parseNodeOptions({}), providerRegistry);

            expect(nodeBalance.balances.size).toBe(0);
            expect(nodeBalance.startingBalance.toString()).toBe('0');

            nodeBalance.refreshBalances();
            await nodeBalance.refreshBalances();

            expect(providerRegistry.getTokenBalance).toBeCalledTimes(1);
            expect(nodeBalance.balances.get('test')?.toString()).toBe('100');
            expect(nodeBalance.balances.size).toBe(1);
        });
    });

    describe('hasEnoughBalanceForStaking', () => {
        it('should return false when node has not enough balance for staking', () => {
            const stake = new NodeBalance({
                ...parseNodeOptions({}),
                stakePerRequest: new Big(100),
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(50));

            expect(stake.hasEnoughBalanceForStaking('test')).toBe(false);
        });

        it('should return false when node has not enough balance for staking', () => {
            const stake = new NodeBalance({
                ...parseNodeOptions({}),
                stakePerRequest: new Big(100),
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(150));

            expect(stake.hasEnoughBalanceForStaking('test')).toBe(true);
        });


        it('should return false when it could not find the provider balance', () => {
            const stake = new NodeBalance({
                ...parseNodeOptions({}),
                stakePerRequest: new Big(100),
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(150));

            expect(stake.hasEnoughBalanceForStaking('testfoo')).toBe(false);
        });
    });

    describe('withdrawBalanceToStake', () => {
        it('should return 0 when there is not enough balance to stake', () => {
            const stake = new NodeBalance({
                ...parseNodeOptions({}),
                stakePerRequest: new Big(200),
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(150));
            const withdrawn = stake.withdrawBalanceToStake('test');

            expect(withdrawn.toString()).toBe('0');
            expect(stake.balances.get('test')?.toString()).toBe('150');
        });

        it('should return the stake amount and reduce the balance', () => {
            const stake = new NodeBalance({
                ...parseNodeOptions({}),
                stakePerRequest: new Big(200),
            }, {} as any);

            stake.balances = new Map();
            stake.balances.set('test', new Big(1000));

            const withdrawn = stake.withdrawBalanceToStake('test');

            expect(withdrawn.toString()).toBe('200');
            expect(stake.balances.get('test')?.toString()).toBe('800');
        });
    });

    describe('deposit', () => {
        it('should deposit the correct amount to a specific provider', async () => {
            const provider = createProviderMock('test');
            const provider2 = createProviderMock('test2');
            const providerRegistry = createMockProviderRegistry([provider, provider2]);
            providerRegistry.getTokenBalance = jest.fn(async () => new Big(100));

            const nodeBalance = new NodeBalance(parseNodeOptions({}), providerRegistry);

            expect(nodeBalance.balances.size).toBe(0);
            expect(nodeBalance.startingBalance.toString()).toBe('0');

            await nodeBalance.refreshBalances(false);

            expect(providerRegistry.getTokenBalance).toBeCalledTimes(2);

            nodeBalance.deposit('test', new Big(222));

            expect(nodeBalance.balances.get('test')?.toString()).toBe('322');
        });

        it('should deposit nothing when the balance could not be found', async () => {
            const provider = createProviderMock('test');
            const provider2 = createProviderMock('test2');
            const providerRegistry = createMockProviderRegistry([provider, provider2]);
            providerRegistry.getTokenBalance = jest.fn(async () => new Big(100));

            const nodeBalance = new NodeBalance(parseNodeOptions({}), providerRegistry);

            expect(nodeBalance.balances.size).toBe(0);
            expect(nodeBalance.startingBalance.toString()).toBe('0');

            await nodeBalance.refreshBalances(false);

            expect(providerRegistry.getTokenBalance).toBeCalledTimes(2);

            nodeBalance.deposit('tester', new Big(222));

            expect(nodeBalance.balances.get('test')?.toString()).toBe('100');
            expect(nodeBalance.balances.get('test2')?.toString()).toBe('100');
        });
    });
});
