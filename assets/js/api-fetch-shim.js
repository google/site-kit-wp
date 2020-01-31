/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch__non-shim';

if ( global._googlesitekitAPIFetchData ) {
	if ( global._googlesitekitAPIFetchData.rootURL ) {
		apiFetch.use( apiFetch.createRootURLMiddleware( global._googlesitekitAPIFetchData.rootURL ) );
	}

	if ( global._googlesitekitAPIFetchData.nonceMiddleware ) {
		apiFetch.nonceMiddleware = apiFetch.createNonceMiddleware();
		apiFetch.use( apiFetch.createNonceMiddleware( global._googlesitekitAPIFetchData.nonceMiddleware ) );
		apiFetch.use( apiFetch.mediaUploadMiddleware );
		apiFetch.nonceEndpoint = global._googlesitekitAPIFetchData.nonceEndpoint;
	}
}

export * from '@wordpress/api-fetch__non-shim';

export default apiFetch;
