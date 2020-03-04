/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import Data from 'assets/js/googlesitekit/data';

if ( typeof global.googlesitekit === 'undefined' ) {
	global.googlesitekit = {};
}

if ( typeof global.googlesitekit.data === 'undefined' ) {
	global.googlesitekit.data = Data;
}

// This is only exported for Jest and is not used in production.
export default Data;
