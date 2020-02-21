/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import SiteKitRegistry from 'googlesitekit-data';
import siteStore, { STORE_NAME } from 'assets/js/googlesitekit/site';

const createStore = ( registry = SiteKitRegistry ) => {
	registry.registerStore( STORE_NAME, siteStore );
};

export default createStore;
