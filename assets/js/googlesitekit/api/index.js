/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { deleteItem, getItem, getKeys, setItem } from './cache';
import { createCacheKey } from './index.private';

// Caching is enabled by default.
let cachingEnabled = true;

/**
 * Get Google Site Kit data.
 *
 * Makes a request to this site's WordPress REST API, which will in
 * turn make GET requests to the relevant Google services' APIs.
 *
 * This method automatically handles authentication, so no credentials
 * are required to use this method.
 *
 * @param {string} type        The data to access. One of 'core' or 'modules'.
 * @param {string} identifier  The data identifier, eg. a module slug like `'search-console'`.
 * @param {string} datapoint   The endpoint to request data from.
 * @param {Object} queryParams Query params to send with the request.
 *
 * @return {Promise} A promise for the `fetch` request.
 */
// eslint-disable-next-line no-unused-vars
export const get = async (
	type,
	identifier,
	datapoint,
	queryParams,
	{ cacheTTL = 3600, useCache = undefined } = {}
) => {
	invariant( type, '`type` argument for GET requests is required.' );
	invariant( identifier, '`identifier` argument for GET requests is required.' );
	invariant( datapoint, '`datapoint` argument for GET requests is required.' );

	const useCacheForRequest = useCache !== undefined ? useCache : usingCache();
	const cacheKey = createCacheKey( type, identifier, datapoint, queryParams );

	if ( useCacheForRequest ) {
		const { cacheHit, value } = await getItem( cacheKey, cacheTTL );

		if ( cacheHit ) {
			return value;
		}
	}

	// Make an API request to retrieve the results.
	try {
		const response = await apiFetch( {
			method: 'GET',
			path: addQueryArgs(
				`/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`,
				queryParams
			),
		} );

		if ( useCacheForRequest ) {
			await setItem( cacheKey, response );
		}

		return response;
	} catch ( error ) {
		// global.console.error( 'Google Site Kit API Error', error );

		throw error;
	}
};

/**
 * Set Google Site Kit data.
 *
 * Makes a request to this site's WordPress REST API, which will in
 * turn make requests to the relevant Google services' APIs to save
 * the data sent in the request.
 *
 * This method automatically handles authentication, so no credentials
 * are required to use this method.
 *
 * @param {string} type       The data to access. One of 'core' or 'modules'.
 * @param {string} identifier The data identifier, eg. a module slug like `'adsense'`.
 * @param {string} datapoint  The endpoint to send data to.
 * @param {Object} data       Request data (eg. post data) to send with the request.
 *
 * @return {Promise} A promise for the `fetch` request.
 */
// eslint-disable-next-line no-unused-vars
export const set = async (
	type,
	identifier,
	datapoint,
	data,
	// eslint-disable-next-line no-unused-vars
	{ useCache = true, queryParams = {} } = {}
) => {
	throw new Error( 'Not yet implemented.' );
};

/**
 * Enable/disable caching.
 *
 * Set the caching to on/off for the entire API library.
 *
 * Individual requests can still be overridden to _disable_ caching,
 * but if caching is turned off it cannot be turned on for a specific request.
 *
 * @param {boolean} shouldUseCache Set to `true` to use this cache across requests; set to `false` to disable caching.
 *
 * @return {boolean} The new caching state (`true` for on, `false` for off).
 */
export const setUsingCache = ( shouldUseCache ) => {
	cachingEnabled = !! shouldUseCache;

	return cachingEnabled;
};

/**
 * Get current caching state for the API.
 *
 * @return {boolean} The current caching state (`true` for on, `false` for off).
 */
export const usingCache = () => {
	return cachingEnabled;
};

/**
 * Invalidate the cache for a specific datapoint or all data.
 *
 * Invalidate cache data for either a specific datapoint, identifier, type, or
 * all data. The more specificity supplied the more granularly cache data will
 * be invalidated.
 *
 * Calling `invalidateCache()` will invalidate _all_ cached data, while calling
 * `invalidateCache( 'modules', 'adsense' )` will invalidate all AdSense data only.
 *
 * @param {string} type       The data type to operate on. One of 'core' or 'modules'.
 * @param {string} identifier The data identifier, eg. a module slug like `'adsense'`.
 * @param {string} datapoint  The endpoint to invalidate cache data for.
 *
 * @return {void}
 */
export const invalidateCache = async ( type, identifier, datapoint ) => {
	const groupPrefix = createCacheKey( type, identifier, datapoint );

	const allKeys = await getKeys();

	allKeys.forEach( ( key ) => {
		if ( key.indexOf( groupPrefix ) === 0 ) {
			deleteItem( key );
		}
	} );
};
