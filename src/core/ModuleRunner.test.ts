import ModuleRunner from './ModuleRunner';
import Module from '@fluxprotocol/oracle-provider-core/dist/Module';
import { createMockRequest } from '../test/mocks/DataRequest';

describe('ModuleRunner', () => {
    describe('callModule', () => {
        it('should call the module and resolve on calling next()', async () => {
            const moduleRunner = new ModuleRunner();
            // @ts-ignore
            const module = new Module({}, {});

            module.call = async (request, next) => {
                expect(request.id).toBe('test-id');
                next(request);
            };

            await moduleRunner.add(module);
            await moduleRunner.callSequence(createMockRequest({ id: 'test-id' }));
        });

        it('should not call module 2 when module 1 throws an error', async () => {
            const moduleRunner = new ModuleRunner();
            // @ts-ignore
            const module1 = new Module({}, {});
            // @ts-ignore
            const module2 = new Module({}, {});

            module1.call = async (request, next) => {
                throw new Error('Should not execute yet');
            };

            module2.call = async () => {
                throw new Error('Test failed');
            };

            await moduleRunner.add(module1);
            await moduleRunner.add(module2);

            moduleRunner.callSequence(createMockRequest({ id: 'test-id' }))
                .then(() => { throw new Error('Test Failed 2') })
                .catch(err => expect(err).toThrowError('Should not execute yet'));
        });
    });
});
