/**
 * API request functions for interacting with WordPress's REST API.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import {
	deleteItem,
	getItem,
	getKeys,
	setItem,
	STORAGE_KEY_PREFIX_ROOT,
} from './cache';
import { stringifyObject, HOUR_IN_SECONDS } from '../../util';
import { isAuthError, isPermissionScopeError } from '../../util/errors';
import { trackAPIError } from '../../util/api';

// Specific error to handle here, see below.
import { CORE_USER } from '../datastore/user/constants';

// Caching is enabled by default.
let cachingEnabled = true;

const KEY_SEPARATOR = '::';

/**
 * Creates a cache key for a set of type/identifier/datapoint values.
 *
 * @since 1.5.0
 * @private
 *
 * @param {string} type        The data to access. One of 'core' or 'modules'.
 * @param {string} identifier  The data identifier, eg. a module slug like `'search-console'`.
 * @param {string} datapoint   The endpoint to request data from.
 * @param {Object} queryParams Query params to send with the request.
 * @return {string} The cache key to use for this set of values.
 */
export const createCacheKey = (
	type,
	identifier,
	datapoint,
	queryParams = {}
) => {
	const keySections = [ type, identifier, datapoint ].filter(
		( keySection ) => {
			return !! keySection && keySection.length;
		}
	);

	if (
		keySections.length === 3 &&
		!! queryParams &&
		queryParams.constructor === Object &&
		Object.keys( queryParams ).length
	) {
		keySections.push( stringifyObject( queryParams ) );
	}

	return keySections.join( KEY_SEPARATOR );
};

/**
 * Dispatches an error to the store, whether it's a permission or auth error.
 *
 * @since 1.25.0
 *
 * @param {Object} error Error object to dispatch.
 */
export const dispatchAPIError = ( error ) => {
	// Check to see if this error was a `ERROR_CODE_MISSING_REQUIRED_SCOPE` error;
	// if so and there is a data store available to dispatch on, dispatch a
	// `setPermissionScopeError()` action.
	// Kind of a hack, but scales to all components.
	const dispatch = global.googlesitekit?.data?.dispatch?.( CORE_USER );
	if ( dispatch ) {
		if ( isPermissionScopeError( error ) ) {
			dispatch.setPermissionScopeError( error );
		} else if ( isAuthError( error ) ) {
			dispatch.setAuthError( error );
		}
	}
};

/**
 * Makes a request to a WP REST API Site Kit endpoint.
 *
 * @since 1.5.0
 * @private
 *
 * @param {string}  type                The data to access. One of 'core' or 'modules'.
 * @param {string}  identifier          The data identifier, eg. a module slug like `'search-console'`.
 * @param {string}  datapoint           The endpoint to request data from.
 * @param {Object}  options             Optional. Options to pass to the request.
 * @param {number}  options.cacheTTL    The oldest cache data to use, in seconds.
 * @param {Object}  options.bodyParams  Request body data to send. Used for `POST`/`PUT` request variables.
 * @param {number}  options.method      HTTP method to use for this request.
 * @param {Object}  options.queryParams Query params to send with the request.
 * @param {boolean} options.useCache    Enable or disable caching for this request only. Caching is only used for `GET` requests.
 * @param {Object}  options.signal      Abort the fetch request.
 * @return {Promise} Response of HTTP request.
 */
export const siteKitRequest = async (
	type,
	identifier,
	datapoint,
	{
		bodyParams,
		cacheTTL = HOUR_IN_SECONDS,
		method = 'GET',
		queryParams,
		useCache = undefined,
		signal,
	} = {}
) => {
	invariant( type, '`type` argument for requests is required.' );
	invariant( identifier, '`identifier` argument for requests is required.' );
	invariant( datapoint, '`datapoint` argument for requests is required.' );

	// Don't check for a `false`-y `useCache` value to ensure we don't fallback
	// to the `usingCache()` behavior when caching is manually disabled on a
	// per-request basis.
	const useCacheForRequest =
		method === 'GET' &&
		( useCache !== undefined ? useCache : usingCache() );
	const cacheKey = createCacheKey( type, identifier, datapoint, queryParams );

	if ( useCacheForRequest ) {
		const { cacheHit, value, isError } = await getItem( cacheKey );

		if ( isError ) {
			dispatchAPIError( value );
			throw value;
		}

		if ( cacheHit ) {
			return value;
		}
	}

	// Make an API request to retrieve the results.
	try {
		const response = await apiFetch( {
			data: bodyParams,
			method,
			signal,
			path: addQueryArgs(
				`/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`,
				queryParams
			),
		} );

		if ( useCacheForRequest ) {
			await setItem( cacheKey, response, { ttl: cacheTTL } );
		}

		return response;
	} catch ( error ) {
		if ( signal?.aborted ) {
			// If the request was canceled, don't do any
			// error handling and just re-throw the error.
			throw error;
		}

		if ( error?.data?.cacheTTL ) {
			await setItem( cacheKey, error, {
				ttl: error.data.cacheTTL,
				isError: true,
			} );
		}

		trackAPIError( { method, datapoint, type, identifier, error } );
		dispatchAPIError( error );
		global.console.error(
			'Google Site Kit API Error',
			`method:${ method }`,
			`datapoint:${ datapoint }`,
			`type:${ type }`,
			`identifier:${ identifier }`,
			`error:"${ error.message }"`
		);

		throw error;
	}
};

/**
 * Gets Google Site Kit data.
 *
 * Makes a request to this site's WordPress REST API, which will in
 * turn make GET requests to the relevant Google services' APIs.
 *
 * This method automatically handles authentication, so no credentials
 * are required to use this method.
 *
 * @since 1.5.0
 *
 * @param {string}  type             The data to access. One of 'core' or 'modules'.
 * @param {string}  identifier       The data identifier, eg. a module slug like `'search-console'`.
 * @param {string}  datapoint        The endpoint to request data from.
 * @param {Object}  data             Data (query params) to send with the request.
 * @param {Object}  options          Extra options for this request.
 * @param {number}  options.cacheTTL The oldest cache data to use, in seconds.
 * @param {boolean} options.useCache Enable or disable caching for this request only.
 * @param {Object}  options.signal   Abort the fetch request.
 * @return {Promise} A promise for the `fetch` request.
 */
export const get = (
	type,
	identifier,
	datapoint,
	data,
	{ cacheTTL = HOUR_IN_SECONDS, useCache = undefined, signal } = {}
) => {
	return siteKitRequest( type, identifier, datapoint, {
		cacheTTL,
		queryParams: data,
		useCache,
		signal,
	} );
};

/**
 * Sets Google Site Kit data.
 *
 * Makes a request to this site's WordPress REST API, which will in
 * turn make requests to the relevant Google services' APIs to save
 * the data sent in the request.
 *
 * This method automatically handles authentication, so no credentials
 * are required to use this method.
 *
 * @since 1.5.0
 *
 * @param {string}  type                The data to access. One of 'core' or 'modules'.
 * @param {string}  identifier          The data identifier, eg. a module slug like `'adsense'`.
 * @param {string}  datapoint           The endpoint to send data to.
 * @param {Object}  data                Request body data (eg. post data) to send with the request.
 * @param {Object}  options             Extra options for this request.
 * @param {number}  options.method      HTTP method to use for this request.
 * @param {boolean} options.queryParams Query params to send with the request.
 * @param {Object}  options.signal      Abort the fetch request.
 * @return {Promise} A promise for the `fetch` request.
 */
export const set = async (
	type,
	identifier,
	datapoint,
	data,
	{ method = 'POST', queryParams = {}, signal } = {}
) => {
	const response = await siteKitRequest( type, identifier, datapoint, {
		bodyParams: { data },
		method,
		queryParams,
		useCache: false,
		signal,
	} );

	await invalidateCache( type, identifier, datapoint );

	return response;
};

/**
 * Enables/disables caching.
 *
 * Set the caching to on/off for the entire API library.
 *
 * Individual requests can still be overridden to _disable_ caching,
 * but if caching is turned off it cannot be turned on for a specific request.
 *
 * @since 1.5.0
 *
 * @param {boolean} shouldUseCache Set to `true` to use this cache across requests; set to `false` to disable caching.
 * @return {boolean} The new caching state (`true` for on, `false` for off).
 */
export const setUsingCache = ( shouldUseCache ) => {
	cachingEnabled = !! shouldUseCache;

	return cachingEnabled;
};

/**
 * Gets the current caching state for the API.
 *
 * @since 1.5.0
 *
 * @return {boolean} The current caching state (`true` for on, `false` for off).
 */
export const usingCache = () => {
	return cachingEnabled;
};

/**
 * Invalidates the cache for a specific datapoint or all data.
 *
 * Invalidate cache data for either a specific datapoint, identifier, type, or
 * all data. The more specificity supplied the more granularly cache data will
 * be invalidated.
 *
 * Calling `invalidateCache()` will invalidate _all_ cached data, while calling
 * `invalidateCache( 'modules', 'adsense' )` will invalidate all AdSense data only.
 *
 * @since 1.5.0
 *
 * @param {string} type       The data type to operate on. One of 'core' or 'modules'.
 * @param {string} identifier The data identifier, eg. a module slug like `'adsense'`.
 * @param {string} datapoint  The endpoint to invalidate cache data for.
 */
export const invalidateCache = async ( type, identifier, datapoint ) => {
	const groupPrefix = createCacheKey( type, identifier, datapoint );

	const allKeys = await getKeys();

	allKeys.forEach( ( key ) => {
		if (
			new RegExp(
				`^${ STORAGE_KEY_PREFIX_ROOT }([^_]+_){2}${ groupPrefix }`
			).test( key )
		) {
			deleteItem( key );
		}
	} );
};

/**
 * API singleton interface. Exposes all public API functions on a singleton.
 *
 * Use individual functions instead of this object whenever possible.
 *
 * @since n.e.x.t
 * @deprecated
 */
const API = {
	invalidateCache,
	get,
	set,
	setUsingCache,
	usingCache,
};

export default API;
