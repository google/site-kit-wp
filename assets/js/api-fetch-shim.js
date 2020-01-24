/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch__non-shim';

if ( global._apiFetch === undefined ) {
	global._apiFetch = apiFetch;

	if ( global._apiFetchRootURL ) {
		apiFetch.use( apiFetch.createRootURLMiddleware( global._apiFetchRootURL ) );
	}

	if ( global._apiFetchNonceMiddleware ) {
		apiFetch.nonceMiddleware = apiFetch.createNonceMiddleware( );
		apiFetch.use( apiFetch.createNonceMiddleware( global._apiFetchNonceMiddleware ) );
		apiFetch.use( apiFetch.mediaUploadMiddleware );
		apiFetch.nonceEndpoint = global._apiFetchNonceEndpoint;
	}
}

export * from '@wordpress/api-fetch__non-shim';

export default global._apiFetch;
