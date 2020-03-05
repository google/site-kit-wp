/**
 * External dependencies
 */
import invariant from 'invariant';
import md5 from 'md5';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { sortObjectProperties } from 'assets/js/util';
import { getItem, setItem } from './cache';
import { usingCache } from './index';

const KEY_SEPARATOR = '::';

/**
 * Create a cache key for a set of type/identifier/datapoint values.
 *
 * @param {string} type        The data to access. One of 'core' or 'modules'.
 * @param {string} identifier  The data identifier, eg. a module slug like `'search-console'`.
 * @param {string} datapoint   The endpoint to request data from.
 * @param {Object} queryParams Query params to send with the request.
 *
 * @return {string} The cache key to use for this set of values.
 */
export const createCacheKey = ( type, identifier, datapoint, queryParams = {} ) => {
	const keySections = [ type, identifier, datapoint ].filter( ( keySection ) => {
		return !! keySection && keySection.length;
	} );

	if (
		keySections.length === 3 &&
		( !! queryParams ) && ( queryParams.constructor === Object ) &&
		Object.keys( queryParams ).length
	) {
		keySections.push(
			md5( JSON.stringify( sortObjectProperties( queryParams ) ) )
		);
	}

	return keySections.join( KEY_SEPARATOR );
};

/**
 * Make a request to a WP REST API Site Kit endpoint.
 *
 * @param {string}  type                The data to access. One of 'core' or 'modules'.
 * @param {string}  identifier          The data identifier, eg. a module slug like `'search-console'`.
 * @param {string}  datapoint           The endpoint to request data from.
 * @param {Object}  options             Options to pass to the request
 * @param {number}  options.cacheTTL    The oldest cache data to use, in seconds.
 * @param {Object}  options.bodyParams  Request body data to send. (Eg. used for `POST`/`PUT` request variables.)
 * @param {number}  options.method      HTTP method to use for this request.
 * @param {Object}  options.queryParams Query params to send with the request.
 * @param {boolean} options.useCache    Enable or disable caching for this request only. (Caching is only used for `GET` requests.)
 */
export const siteKitRequest = async ( type, identifier, datapoint, {
	bodyParams,
	cacheTTL = 3600,
	method = 'GET',
	queryParams,
	useCache = undefined,
} = {} ) => {
	invariant( type, '`type` argument for requests is required.' );
	invariant( identifier, '`identifier` argument for requests is required.' );
	invariant( datapoint, '`datapoint` argument for requests is required.' );

	// Don't check for a `false`-y `useCache` value to ensure we don't fallback
	// to the `usingCache()` behaviour when caching is manually disabled on a
	// per-request basis.
	const useCacheForRequest = method === 'GET' && ( useCache !== undefined ? useCache : usingCache() );
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
			data: bodyParams,
			method,
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
		global.console.error( 'Google Site Kit API Error', error );

		throw error;
	}
};
