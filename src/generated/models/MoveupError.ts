/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { MoveupErrorCode } from './MoveupErrorCode';

/**
 * This is the generic struct we use for all API errors, it contains a string
 * message and an Moveup API specific error code.
 */
export type MoveupError = {
    /**
     * A message describing the error
     */
    message: string;
    error_code: MoveupErrorCode;
    /**
     * A code providing VM error details when submitting transactions to the VM
     */
    vm_error_code?: number;
};

