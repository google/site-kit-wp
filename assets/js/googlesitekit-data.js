/**
 * External dependencies
 */
import SiteKitRegistry, * as DataFunctions from 'assets/js/googlesitekit/data';

if ( typeof global.googlesitekit === 'undefined' ) {
	global.googlesitekit = {};
}

if ( typeof global.googlesitekit.data === 'undefined' ) {
	global.googlesitekit.data = { ...DataFunctions, SiteKitRegistry };
}

export * from 'assets/js/googlesitekit/data';
export default SiteKitRegistry;
