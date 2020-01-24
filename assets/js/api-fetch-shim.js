/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch__non-shim';

if ( global._apiFetch === undefined ) {
	global._apiFetch = apiFetch;

	// global.console.error( 'BURGER TIME global._apiFetchRootURL', global._apiFetchRootURL );
	apiFetch.use( apiFetch.createRootURLMiddleware( global._apiFetchRootURL ) );

	apiFetch.nonceMiddleware = apiFetch.createNonceMiddleware( global._apiFetchNonceMiddleware );
	apiFetch.use( apiFetch.createNonceMiddleware( global._apiFetchNonceMiddleware ) );
	apiFetch.use( apiFetch.mediaUploadMiddleware );
	apiFetch.nonceEndpoint = global._apiFetchNonceEndpoint;
}

// export * from '@wordpress/api-fetch__non-shim';

export default global._apiFetch;
