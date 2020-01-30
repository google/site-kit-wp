/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch__non-shim';

if ( global._googlesitekitBase ) {
	if ( global._googlesitekitBase.apiFetchRootURL ) {
		apiFetch.use( apiFetch.createRootURLMiddleware( global._googlesitekitBase.apiFetchRootURL ) );
	}

	if ( global._googlesitekitBase.apiFetchNonceMiddleware ) {
		apiFetch.nonceMiddleware = apiFetch.createNonceMiddleware( );
		apiFetch.use( apiFetch.createNonceMiddleware( global._googlesitekitBase.apiFetchNonceMiddleware ) );
		apiFetch.use( apiFetch.mediaUploadMiddleware );
		apiFetch.nonceEndpoint = global._googlesitekitBase.apiFetchNonceEndpoint;
	}
}

export * from '@wordpress/api-fetch__non-shim';

export default apiFetch;
