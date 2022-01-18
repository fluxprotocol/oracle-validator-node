import * as Sentry from "@sentry/node";
import { CaptureContext, Span, SpanContext, Transaction } from "@sentry/types";
import { ENABLE_ANALYTICS, SENTRY_DSN } from "../config";

type SpanContextInternal = Pick<SpanContext, Exclude<keyof SpanContext, 'spanId' | 'sampled' | 'traceId' | 'parentSpanId'>>;

export class AnalyticsChild {
    child?: Span;

    constructor(transaction?: Transaction, spanContext?: SpanContextInternal) {
        this.child = transaction?.startChild(spanContext)
    }

    finish() {
        this.child?.finish();
    }
}

class AnalyticsService {
    transactions: Map<string, Transaction> = new Map();

    constructor() {
        Sentry.setUser({
            id: process.env.NEAR_ACCOUNT_ID,
        });
    }

    log(msg: string, context?: CaptureContext) {
        if (!ENABLE_ANALYTICS) return;

        Sentry.captureMessage(msg, {
            ...context,
            level: Sentry.Severity.Debug,
        });
    }

    startTransaction(name: string) {
        if (!ENABLE_ANALYTICS) return;

        const transaction = Sentry.startTransaction({
            name,
        });

        this.transactions.set(name, transaction);
    }

    startChild(txName: string, spanContext?: SpanContextInternal): AnalyticsChild {
        if (!ENABLE_ANALYTICS) return new AnalyticsChild();

        const transaction = this.transactions.get(txName);
        return new AnalyticsChild(transaction, spanContext);
    }

    finishTransaction(txName: string) {
        const transaction = this.transactions.get(txName);
        transaction?.finish();
    }
}

export default new AnalyticsService();
