/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

if ( global._e2eApiFetch === undefined ) {
	global._e2eApiFetch = apiFetch;
}

// global.console.error( 'BURGERS YUM YUM', global._e2eApiFetch );
// global.console.error( 'REAL GLOBAL', global._apiFetch );
