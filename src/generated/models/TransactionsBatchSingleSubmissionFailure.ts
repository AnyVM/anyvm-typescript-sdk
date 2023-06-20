/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { MoveupError } from './MoveupError';

/**
 * Information telling which batch submission transactions failed
 */
export type TransactionsBatchSingleSubmissionFailure = {
    error: MoveupError;
    /**
     * The index of which transaction failed, same as submission order
     */
    transaction_index: number;
};

