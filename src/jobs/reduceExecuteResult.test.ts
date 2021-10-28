import { ExecuteResultType } from "@fluxprotocol/oracle-provider-core/dist/ExecuteResult";
import reduceExecuteResult from "./reduceExecuteResult";

describe('reduceExecuteResult', () => {
    it('should return success when the API resolved to a fake "Invalid"', () => {
        const result = reduceExecuteResult([
            {
                status: 0,
                data: 'Invalid',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'Invalid',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'Invalid',
                type: ExecuteResultType.Success,
            }
        ]);

        expect(result).toStrictEqual({
            status: 200,
            data: 'Invalid',
            type: ExecuteResultType.Success,
        });
    });

    it('should give back the answer if all results are the same', () => {
        const result = reduceExecuteResult([
            {
                status: 0,
                data: 'my-answer',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'my-answer',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'my-answer',
                type: ExecuteResultType.Success,
            }
        ]);

        expect(result).toStrictEqual({
            status: 200,
            data: 'my-answer',
            type: ExecuteResultType.Success,
        });
    });

    it('should resolve to invalid when the answers are not determenistic', () => {
        const result = reduceExecuteResult([
            {
                status: 0,
                data: 'my-answer-true',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'my-answer-true',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'my-answer',
                type: ExecuteResultType.Success,
            }
        ]);

        expect(result).toStrictEqual({
            status: 500,
            error: 'ERR_NON_DETERMENISTIC_ANSWER',
            type: ExecuteResultType.Error,
        });
    });

    it('should mark as invalid when there is a 1/2 split in answers', () => {
        const result = reduceExecuteResult([
            {
                status: 0,
                data: 'my-answer-true',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'my-answer-true',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'my-answer',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'my-answer',
                type: ExecuteResultType.Success,
            }
        ]);

        expect(result).toStrictEqual({
            status: 500,
            error: 'ERR_NON_DETERMENISTIC_ANSWER',
            type: ExecuteResultType.Error,
        });
    });

    it('should return invalid when all answers are invalid', () => {
        const result = reduceExecuteResult([
            {
                status: 0,
                error: 'my-answer-true',
                type: ExecuteResultType.Error,
            },
            {
                status: 0,
                error: 'my-answer-true',
                type: ExecuteResultType.Error,
            },
            {
                status: 0,
                error: 'my-answer-true',
                type: ExecuteResultType.Error,
            },
            {
                status: 0,
                error: 'my-answer-true',
                type: ExecuteResultType.Error,
            }
        ]);

        expect(result).toStrictEqual({
            status: 500,
            error: 'ERR_INVALID_REQUEST',
            type: ExecuteResultType.Error,
        });
    });

    it('should should ignore an invalid when there is still an answer', () => {
        const result = reduceExecuteResult([
            {
                status: 0,
                error: 'my-answer-true',
                type: ExecuteResultType.Error,
            },
            {
                status: 0,
                error: 'my-answer-true',
                type: ExecuteResultType.Error,
            },
            {
                status: 0,
                error: 'my-answer-true',
                type: ExecuteResultType.Error,
            },
            {
                status: 0,
                data: 'not-invalid',
                type: ExecuteResultType.Success,
            }
        ]);

        expect(result).toStrictEqual({
            status: 200,
            data: 'not-invalid',
            type: ExecuteResultType.Success,
        });
    });

    it('should should resolve to invalid when after 1 invalid it still does not have a determenistic answer', () => {
        const result = reduceExecuteResult([
            {
                status: 0,
                data: 'my-answer',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                data: 'my-answer',
                type: ExecuteResultType.Success,
            },
            {
                status: 0,
                error: 'something-invalid',
                type: ExecuteResultType.Error,
            },
            {
                status: 0,
                data: 'not-invalid',
                type: ExecuteResultType.Success,
            }
        ]);

        expect(result).toStrictEqual({
            status: 500,
            error: 'ERR_NON_DETERMENISTIC_ANSWER',
            type: ExecuteResultType.Error,
        });
    });
})
