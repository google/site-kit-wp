/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import API from 'assets/js/googlesitekit/api';

if ( global.googlesitekit === undefined ) {
	global.googlesitekit = {};
}

if ( global.googlesitekit.api === undefined ) {
	global.googlesitekit.api = API;
}

// This is only exported for Jest and is not used in production.
export default API;
