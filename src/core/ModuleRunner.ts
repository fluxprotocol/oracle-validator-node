import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import Module from '@fluxprotocol/oracle-provider-core/dist/Module';
import logger from '../services/LoggerService';

class ModuleRunner {
    modules: Module[] = [];
    lastTick?: Date;
    tickIntervalId?: any;

    async add(module: Module) {
        await module.init();
        this.modules.push(module);
    }

    private callModule(request: DataRequest, index = 0): Promise<DataRequest> {
        return new Promise(async (resolve) => {
           const module = this.modules[index];

           await module.call(request, (nextRequest) => {
               resolve(nextRequest);
           });
        });
    }

    async callSequence(request: DataRequest): Promise<DataRequest> {
        try {
            let currentRequest = request;

            for await (const [index] of this.modules.entries()) {
                currentRequest = await this.callModule(currentRequest, index);
            }

            return currentRequest;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    private tick() {
        if (!this.lastTick) {
            this.lastTick = new Date();
        }

        const now = new Date();
        const delta = now.getTime() - this.lastTick.getTime();
        this.lastTick = now;

        this.modules.forEach(module => module.tick(delta));
    }

    startTicking() {
        this.tickIntervalId = setInterval(() => this.tick(), 1000);
    }

    stopTicking() {
        clearInterval(this.tickIntervalId);
    }
}

export default ModuleRunner;
