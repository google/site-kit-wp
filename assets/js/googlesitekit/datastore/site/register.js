/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import store, { STORE_NAME } from 'assets/js/googlesitekit/datastore/site';

// Register this store on the global registry.
Data.registerStore( STORE_NAME, store );
