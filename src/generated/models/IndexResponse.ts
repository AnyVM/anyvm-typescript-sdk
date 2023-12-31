/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { RoleType } from './RoleType';
import type { U64 } from './U64';

/**
 * The struct holding all data returned to the client by the
 * index endpoint (i.e., GET "/").  Only for responding in JSON
 */
export type IndexResponse = {
    /**
     * Chain ID of the current chain
     */
    chain_id: U64;
    epoch: U64;
    ledger_version: U64;
    oldest_ledger_version: U64;
    ledger_timestamp: U64;
    node_role: RoleType;
    oldest_block_height: U64;
    block_height: U64;
    /**
     * Git hash of the build of the API endpoint.  Can be used to determine the exact
     * software version used by the API endpoint.
     */
    git_hash?: string;
};

