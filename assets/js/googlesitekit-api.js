/**
 * External dependencies
 */
import * as API from 'assets/js/googlesitekit/api';

if ( typeof global.googlesitekit === 'undefined' ) {
	global.googlesitekit = {};
}

if ( typeof global.googlesitekit.api === 'undefined' ) {
	global.googlesitekit.api = API;
}

export * from 'assets/js/googlesitekit/api';
