/**
 * Data API.
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
import { each, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { addAction, applyFilters, doAction, hasAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getQueryParameter } from '../../util/standalone';
import { isWPError } from '../../util/errors';
import { getCacheKey, getCache, setCache } from './cache';
import { TYPE_CORE, TYPE_MODULES } from './constants';
import { invalidateCacheGroup } from './invalidate-cache-group';
import { trackAPIError } from '../../util/api';

export { TYPE_CORE, TYPE_MODULES };

const dataAPI = {

	maxRequests: 10,

	// Disabled because the typing of the `combinedRequest` param causes the JSDoc rules
	// to format things quite strangely.
	/* eslint-disable jsdoc/check-line-alignment */
	/**
	 * Gets data for multiple requests from the REST API using a single batch process.
	 *
	 * @since 1.0.0
	 *
	 * @param {Array.<{maxAge: Date, type: string, identifier: string, datapoint: string, callback: Function}>} combinedRequest  An array of data requests to resolve.
	 * @param {boolean}    secondaryRequest Set to `true` if this is this is after the first request.
	 * @return {Promise} A promise for multiple fetch requests.
	 */
	/* eslint-enable jsdoc/check-line-alignment */
	combinedGet( combinedRequest, secondaryRequest = false ) {
		// First, resolve any cache matches immediately, queue resolution of the rest.
		let dataRequest = [];
		let cacheDelay = 25;
		each( combinedRequest, ( request ) => {
			request.key = getCacheKey( request.type, request.identifier, request.datapoint, request.data );
			const cache = getCache( request.key, request.maxAge );

			if ( 'undefined' !== typeof cache ) {
				setTimeout( () => {
					this.resolve( request, cache );
				}, cacheDelay );
				cacheDelay += 25;
			} else {
				// Add the request to the queue.
				dataRequest.push( request );
			}
		} );

		// Sort the modules by priority.
		dataRequest = sortBy( dataRequest, 'priority' );

		// Only request each key once.
		const toRequest = [];
		const deferredRequests = [];
		const keyIndexesMap = {};
		const noLowPriorityRequests = !! dataRequest.find( ( request ) => {
			return request.priority < 10;
		} );
		each( dataRequest, ( request, index ) => {
			// Defer any datapoints with a priority of 10 or greater into a second request.
			if ( ! secondaryRequest && 10 <= request.priority && noLowPriorityRequests ) {
				deferredRequests.push( request );
			} else if ( ! keyIndexesMap[ request.key ] ) {
				keyIndexesMap[ request.key ] = [ index ];
				toRequest.push( request );
			} else {
				keyIndexesMap[ request.key ].push( index );
			}
		} );

		const maxDatapointsPerRequest = 10;
		const currentRequest = toRequest.slice( 0, maxDatapointsPerRequest );
		let remainingDatapoints = toRequest.slice( maxDatapointsPerRequest );

		remainingDatapoints = remainingDatapoints.concat( deferredRequests );

		if ( 0 === currentRequest.length && 0 === remainingDatapoints.length ) {
			// Trigger an action indicating this data load completed from the cache.
			doAction( 'googlesitekit.dataLoaded', 'cache' );
			return;
		}

		// Fetch the remaining datapoints in another request.
		if ( 0 < remainingDatapoints.length && 0 < this.maxRequests-- ) {
			setTimeout( () => {
				this.combinedGet( remainingDatapoints, true );
			}, 50 );
		} else {
			this.maxRequests = 10;
		}

		const datacache = null !== getQueryParameter( 'datacache' );
		return apiFetch( {
			path: addQueryArgs( '/google-site-kit/v1/data/', { datacache: datacache || undefined } ),
			data: { request: currentRequest },
			method: 'POST',
		} ).then( ( results ) => {
			Object.entries( results ).forEach( ( [ requestKey, response ] ) => {
				if ( ! keyIndexesMap[ requestKey ] ) {
					console.debug( 'data_error', 'unknown response key ' + requestKey ); // eslint-disable-line no-console
					return;
				}

				if ( isWPError( response ) ) {
					// These variables will be the same for each request so use the first
					// to avoid handling/reporting the same error multiple times.
					const requestIndex = keyIndexesMap[ requestKey ][ 0 ];
					const { datapoint, type, identifier } = dataRequest[ requestIndex ];

					this.handleWPError( {
						// Report as GET requests as this is the internal method
						// rather than the method of the batch request itself.
						method: 'GET',
						datapoint,
						type,
						identifier,
						error: response,
					} );
				} else {
					setCache( requestKey, response );
				}

				// Each request is only made once, but may have been requested more than once.
				// Iterate over each request object for the key to resolve it.
				keyIndexesMap[ requestKey ].forEach( ( requestIndex ) => {
					const request = dataRequest[ requestIndex ];

					this.resolve( request, response );
				} );

				// Trigger an action indicating this data load completed from the API.
				if ( 0 === remainingDatapoints.length ) {
					doAction( 'googlesitekit.dataLoaded', 'api' );
				}
			} );

			// Resolve any returned data requests, then re-request the remainder after a pause.
		} ).catch( ( error ) => {
			// Handle the error and give up trying.
			console.warn( 'Error caught during combinedGet', `code:${ error.code }`, `error:"${ error.message }"` ); // eslint-disable-line no-console
		} );
	},

	handleWPError( { method, datapoint, type, identifier, error } ) {
		// eslint-disable-next-line no-console
		console.warn(
			'WP Error in data response',
			`method:${ method }`,
			`type:${ type }`,
			`identifier:${ identifier }`,
			`datapoint:${ datapoint }`,
			`error:"${ error.message }"`,
		);

		trackAPIError( { method, datapoint, type, identifier, error } );
	},

	/**
	 * Resolves a request.
	 *
	 * @since 1.0.0
	 *
	 * @param {Object} request Request object to resolve.
	 * @param {any}    result  Result to resolve this request with.
	 */
	resolve( request, result ) {
		// Call the resolver callback with the data.
		if ( request && 'function' === typeof request.callback ) {
			request.callback( result, request.datapoint );
		}
	},

	invalidateCacheGroup,

	/**
	 * Collects the initial module data request.
	 *
	 * @since 1.0.0
	 *
	 * @param {string} context    The context to retrieve the module data for. One of 'Dashboard', 'Settings', or 'Post'.
	 * @param {Object} moduleArgs Arguments passed from the module.
	 *
	 */
	collectModuleData( context, moduleArgs ) {
		/**
		 * Filter the data requested on the dashboard page once it loads.
		 *
		 * Modules use this filter to attach the datapoints they need to resolve after page load.
		 *
		 * @since 1.0.0
		 *
		 * @param {Array} datapoints The datapoints to retrieve.
		 */
		const requestedModuleData = applyFilters( 'googlesitekit.module' + context + 'DataRequest', [], moduleArgs );

		if ( 0 !== requestedModuleData.length ) {
			this.combinedGet( requestedModuleData );
		}
	},

	/**
	 * Gets data using the REST API.
	 *
	 * @since 1.0.0
	 *
	 * @param {string}  type       The data to access. One of 'core' or 'modules'.
	 * @param {string}  identifier The data identifier, for example a module slug.
	 * @param {string}  datapoint  The datapoint.
	 * @param {Object}  data       Optional arguments to pass along.
	 * @param {boolean} nocache    Set to true to bypass cache, default: true.
	 * @return {Promise} A promise for the fetch request.
	 */
	get( type, identifier, datapoint, data = {}, nocache = true ) {
		const cacheKey = getCacheKey( type, identifier, datapoint, data );

		if ( ! nocache ) {
			const cache = getCache( cacheKey, 3600 );

			if ( 'undefined' !== typeof cache ) {
				return new Promise( ( resolve ) => {
					resolve( cache );
				} );
			}
		}

		// Make an API request to retrieve the results.
		return apiFetch( {
			path: addQueryArgs( `/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`, data ),
		} ).then( ( results ) => {
			if ( ! nocache ) {
				setCache( cacheKey, results );
			}

			return Promise.resolve( results );
		} ).catch( ( error ) => {
			this.handleWPError( { method: 'GET', datapoint, type, identifier, error } );

			return Promise.reject( error );
		} );
	},

	/**
	 * Sets data using the REST API.
	 *
	 * @since 1.0.0
	 *
	 * @param {string} type       The data to access. One of 'core' or 'modules'.
	 * @param {string} identifier The data identifier, for example a module slug.
	 * @param {string} datapoint  The datapoint.
	 * @param {Object} data       The data to set.
	 * @return {Promise} A promise for the fetch request.
	 */
	set( type, identifier, datapoint, data ) {
		const body = {};
		body.data = data;

		// Make an API request to store the data.
		return apiFetch( { path: `/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`,
			data: body,
			method: 'POST',
		} ).then( ( response ) => {
			dataAPI.invalidateCacheGroup( type, identifier, datapoint );

			return new Promise( ( resolve ) => {
				resolve( response );
			} );
		} ).catch( ( error ) => {
			this.handleWPError( { method: 'POST', datapoint, type, identifier, error } );

			return Promise.reject( error );
		} );
	},
	/**
	 * Sets a module to activated or deactivated using the REST API.
	 *
	 * @since 1.0.0
	 *
	 * @param {string}  slug   The module slug.
	 * @param {boolean} active Whether the module should be active or not.
	 * @return {Promise} A promise for the fetch request.
	 */
	setModuleActive( slug, active ) {
		return this.set( TYPE_CORE, 'modules', 'activation', { slug, active } );
	},
};

// Init data module once.
if ( ! hasAction( 'googlesitekit.moduleLoaded', 'googlesitekit.collectModuleData' ) ) {
	addAction(
		'googlesitekit.moduleLoaded',
		'googlesitekit.collectModuleData',
		dataAPI.collectModuleData.bind( dataAPI )
	);
}

export default dataAPI;
