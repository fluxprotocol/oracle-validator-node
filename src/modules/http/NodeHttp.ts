// import express from 'express';
// import { HTTP_PORT } from '../../config';
// import logger from '../../services/LoggerService';
// import JobWalker from '../../core/JobWalker';
// import StatusController from './controllers/StatusController';
// import { NodeHttpContext } from './NodeHttpContext';

// export function startHttpServer(jobWalker: JobWalker) {
//     const app = express();

//     app.use((req, res, next) => {
//         // @ts-ignore
//         req.context = {
//             jobWalker,
//         } as NodeHttpContext;

//         next();
//     });

//     app.use('/status', StatusController);

//     app.listen(HTTP_PORT, () => {
//         logger.info(`🌍 HTTP listening on port ${HTTP_PORT}`);
//     });
// }
