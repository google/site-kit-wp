/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import SiteKitRegistry from 'assets/js/googlesitekit/data';
import { collect, collectReducers } from 'assets/js/googlesitekit/data/utils';

if ( typeof global.googlesitekit === 'undefined' ) {
	global.googlesitekit = {};
}

const registry = SiteKitRegistry;
if ( typeof global.googlesitekit.data === 'undefined' ) {
	global.googlesitekit.data = { collect, collectReducers, registry };
}

export { collect, collectReducers, registry };

export default global.googlesitekit.data;
