import express from 'express';
import jsonRouter from 'express-json-rpc-router';
import createNodeController from './controllers/NodeController';
import Module from "@fluxprotocol/oracle-provider-core/dist/Module";

export default class HttpModule extends Module {
    static moduleName = 'Http';

    async init() {
        const app = express();

        app.use(express.json());
        app.use(jsonRouter({
            methods: {
                ...createNodeController(this.dependencies),
            }
        }));

        const httpPort = Number(this.config['HTTP_PORT'] ?? '28484');

        app.listen(httpPort, () => {
            this.dependencies.logger.info(`🌍 RPC listening on port ${httpPort}`);
        });
    }
}
