/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

if ( global._e2eApiFetch === undefined ) {
	global._e2eApiFetch = apiFetch;
}
