/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch__non-shim';

const {
	nonce,
	nonceEndpoint,
	preloadedData,
	rootURL,
} = global._googlesitekitAPIFetchData || {};

apiFetch.nonceEndpoint = nonceEndpoint;
apiFetch.nonceMiddleware = apiFetch.createNonceMiddleware( nonce );
apiFetch.rootURLMiddleware = apiFetch.createRootURLMiddleware( rootURL );
apiFetch.preloadingMiddleware = apiFetch.createPreloadingMiddleware( preloadedData );

apiFetch.use( apiFetch.nonceMiddleware );
apiFetch.use( apiFetch.mediaUploadMiddleware );
apiFetch.use( apiFetch.rootURLMiddleware );
apiFetch.use( apiFetch.preloadingMiddleware );

export * from '@wordpress/api-fetch__non-shim';

export default apiFetch;
