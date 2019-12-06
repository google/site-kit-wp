/**
 * External dependencies
 */
import API from 'assets/js/googlesitekit/api';

if ( typeof window.googlesitekit === 'undefined' ) {
	throw new Error( '`googlesitekit` is undefined. You need to import `googlesitekit` to use the `googlesitekit-api` library.' );
}

window.googlesitekit.api = API;
