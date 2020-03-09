/**
 * API request functions for interacting with WordPress's REST API.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import { deleteItem, getKeys } from './cache';
import { createCacheKey, siteKitRequest } from './index.private';

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
 * @param {string}  type             The data to access. One of 'core' or 'modules'.
 * @param {string}  identifier       The data identifier, eg. a module slug like `'search-console'`.
 * @param {string}  datapoint        The endpoint to request data from.
 * @param {Object}  data             Data (query params) to send with the request.
 * @param {Object}  options          Extra options for this request.
 * @param {number}  options.cacheTTL The oldest cache data to use, in seconds.
 * @param {boolean} options.useCache Enable or disable caching for this request only.
 *
 * @return {Promise} A promise for the `fetch` request.
 */
export const get = async (
	type,
	identifier,
	datapoint,
	data,
	{ cacheTTL = 3600, useCache = undefined } = {}
) => {
	return siteKitRequest( type, identifier, datapoint, {
		cacheTTL,
		queryParams: data,
		useCache,
	} );
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
 * @param {string} type                 The data to access. One of 'core' or 'modules'.
 * @param {string} identifier           The data identifier, eg. a module slug like `'adsense'`.
 * @param {string} datapoint            The endpoint to send data to.
 * @param {Object} data                 Request body data (eg. post data) to send with the request.
 * @param {Object}  options             Extra options for this request.
 * @param {number}  options.method      HTTP method to use for this request.
 * @param {boolean} options.queryParams Query params to send with the request.
 *
 * @return {Promise} A promise for the `fetch` request.
 */
export const set = async (
	type,
	identifier,
	datapoint,
	data,
	{ method = 'POST', queryParams = {} } = {}
) => {
	const response = await siteKitRequest( type, identifier, datapoint, {
		bodyParams: data,
		method,
		queryParams,
		useCache: false,
	} );

	await invalidateCache( type, identifier, datapoint );

	return response;
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

const API = {
	invalidateCache,
	get,
	set,
	setUsingCache,
	usingCache,
};

export default API;
