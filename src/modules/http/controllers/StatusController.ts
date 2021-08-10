// import express from 'express';
// import { calculateBalanceStatus } from '../../../services/NodeBalanceService';
// import { getLatestDataRequests } from '../../NodeSyncer';
// import { NodeHttpContext } from '../NodeHttpContext';

// const StatusController = express.Router();

// StatusController.get('/', async (req, res) => {
//     // @ts-ignore
//     const context: NodeHttpContext = req.context;
//     const balanceStatus = calculateBalanceStatus(context.jobWalker.nodeBalance, context.jobWalker);
//     const latestRequests = await getLatestDataRequests();

//     res.json({
//         processing: context.jobWalker.processingIds.size,
//         watching: context.jobWalker.requests.size,
//         profit: balanceStatus.profit.toString(),
//         activelyStaking: balanceStatus.activelyStaking.toString(),
//         balance: balanceStatus.balance.toString(),
//         latestRequests: latestRequests.map((latestRequest) => ({
//             provider: latestRequest.provider,
//             requestId: latestRequest.id,
//         })),
//     });
// });

// export default StatusController;
