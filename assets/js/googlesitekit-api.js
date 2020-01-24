/**
 * External dependencies
 */
import * as API from 'assets/js/googlesitekit/api';

if ( typeof global.googlesitekit === 'undefined' ) {
	global.googlesitekit = {};
}

global.googlesitekit.api = API;
