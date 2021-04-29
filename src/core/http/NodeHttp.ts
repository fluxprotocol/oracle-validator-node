import express from 'express';
import { NodeOptions } from "../../models/NodeOptions";
import logger from '../../services/LoggerService';
import JobWalker from '../JobWalker';
import StatusController from './controllers/StatusController';
import { NodeHttpContext } from './NodeHttpContext';

export function startHttpServer(options: NodeOptions, jobWalker: JobWalker) {
    const app = express();

    app.use((req, res, next) => {
        // @ts-ignore
        req.context = {
            jobWalker,
        } as NodeHttpContext;

        next();
    });

    app.use('/status', StatusController);

    app.listen(options.http.port, () => {
        logger.info(`🌍 HTTP listening on port ${options.http.port}`);
    });
}
