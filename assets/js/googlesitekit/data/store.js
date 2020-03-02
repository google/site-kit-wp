/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import siteStore, { STORE_NAME as siteStoreName } from 'assets/js/googlesitekit/data/stores/site';

export const registerSiteKitStores = ( registry ) => {
	registry.registerStore( siteStoreName, siteStore );
};
