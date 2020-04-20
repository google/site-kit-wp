/**
 * Data API.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { each, intersection, isEqual, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { addAction, applyFilters, doAction, addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getStorage } from '../../util/storage';
import { getCurrentDateRangeSlug } from '../../util/date-range';
import { fillFilterWithComponent } from '../../util/helpers';
import { getQueryParameter } from '../../util/standalone';
import DashboardAuthAlert from '../notifications/dashboard-auth-alert';
import DashboardPermissionAlert from '../notifications/dashboard-permission-alert';
import { getCacheKey, getCache, lazilySetupLocalCache, setCache } from './cache';

export const TYPE_CORE = 'core';
export const TYPE_MODULES = 'modules';

/**
 * Gets a copy of the given data request object with the data.dateRange populated via filter, if not set.
 * Respects the current dateRange value, if set.
 *
 * @param {Object} originalRequest Data request object.
 * @param {string} dateRange Default date range slug to use if not specified in the request.
 * @return {Object} New data request object.
 */
const requestWithDateRange = ( originalRequest, dateRange ) => {
	// Make copies for reference safety, ensuring data exists.
	const request = { data: {}, ...originalRequest };
	// Use the dateRange in request.data if passed, fallback to provided default value.
	request.data = { dateRange, ...request.data };

	return request;
};

const dataAPI = {

	maxRequests: 10,

	init() {
		addAction(
			'googlesitekit.moduleLoaded',
			'googlesitekit.collectModuleListingData',
			this.collectModuleData.bind( this )
		);
	},

	/**
	 * Gets data for multiple requests from the cache in a single batch process.
	 *
	 * This is a replica of combinedGet but only fetching data from cache. No requests are done.
	 * Solves issue for publisher wins to retrieve data without performing additional requests.
	 * Likely this will be removed after refactoring.
	 *
	 * @param {Array.<{maxAge: Date, type: string, identifier: string, datapoint: string, callback: Function}>} combinedRequest An array of data requests to resolve.
	 *
	 * @return {Promise} A promise for the cache lookup.
	 */
	combinedGetFromCache( combinedRequest ) {
		return new Promise( ( resolve, reject ) => {
			try {
				const responseData = [];
				const dateRange = getCurrentDateRangeSlug();
				each( combinedRequest, ( originalRequest ) => {
					const request = requestWithDateRange( originalRequest, dateRange );
					request.key = getCacheKey( request.type, request.identifier, request.datapoint, request.data );
					const cache = getCache( request.key, request.maxAge );

					if ( 'undefined' !== typeof cache ) {
						responseData[ request.key ] = cache;

						this.resolve( request, cache );
					}
				} );

				resolve( responseData );
			} catch ( err ) {
				reject();
			}
		} );
	},

	/**
	 * Gets data for multiple requests from the REST API using a single batch process.
	 *
	 * @param {Array.<{maxAge: Date, type: string, identifier: string, datapoint: string, callback: Function}>} combinedRequest An array of data requests to resolve.
	 * @param {boolean} secondaryRequest Is this the second (or more) request?
	 *
	 * @return {Promise} A promise for multiple fetch requests.
	 */
	combinedGet( combinedRequest, secondaryRequest = false ) {
		// First, resolve any cache matches immediately, queue resolution of the rest.
		let dataRequest = [];
		let cacheDelay = 25;
		const dateRange = getCurrentDateRangeSlug();
		each( combinedRequest, ( originalRequest ) => {
			const request = requestWithDateRange( originalRequest, dateRange );
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
			each( results, ( result, key ) => {
				if ( ! keyIndexesMap[ key ] ) {
					console.error( 'data_error', 'unknown response key ' + key ); // eslint-disable-line no-console
					return;
				}

				this.handleWPError( result );

				each( keyIndexesMap[ key ], ( index ) => {
					const request = dataRequest[ index ];

					setCache( request.key, result );
					this.resolve( request, result );
				} );

				// Trigger an action indicating this data load completed from the API.
				if ( 0 === remainingDatapoints.length ) {
					doAction( 'googlesitekit.dataLoaded', 'api' );
				}
			} );

			// Resolve any returned data requests, then re-request the remainder after a pause.
		} ).catch( ( err ) => {
			// Handle the error and give up trying.
			console.warn( 'Error caught during combinedGet', err ); // eslint-disable-line no-console
		} );
	},

	handleWPError( error ) {
		const wpErrorKeys = [ 'code', 'data', 'message' ];
		const commonKeys = intersection( wpErrorKeys, Object.keys( error ) );
		if ( ! isEqual( wpErrorKeys, commonKeys ) ) {
			return;
		}

		// eslint-disable-next-line no-console
		console.warn( 'WP Error in data response', error );
		const { data } = error;

		if ( ! data || ! data.reason ) {
			return;
		}

		let addedNoticeCount = 0;

		// Add insufficient scopes warning.
		if ( [ 'authError', 'insufficientPermissions' ].includes( data.reason ) ) {
			addFilter( 'googlesitekit.ErrorNotification',
				'googlesitekit.AuthNotification',
				fillFilterWithComponent( DashboardAuthAlert ), 1 );
			addedNoticeCount++;
		}

		// Insufficient access permissions.
		if ( 'forbidden' === data.reason ) {
			addFilter( 'googlesitekit.ErrorNotification',
				'googlesitekit.AuthNotification',
				fillFilterWithComponent( DashboardPermissionAlert ), 1 );
			addedNoticeCount++;
		}

		if ( addedNoticeCount ) {
			addFilter( 'googlesitekit.TotalNotifications',
				'googlesitekit.AuthCountIncrease', ( count ) => {
					// Only run once.
					removeFilter( 'googlesitekit.TotalNotifications', 'googlesitekit.AuthCountIncrease' );
					return count + addedNoticeCount;
				} );
		}
	},

	/**
	 * Resolves a request.
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

	/**
	 * Invalidates all caches associated with a specific cache group.
	 *
	 * @param {string} type       The data to access. One of 'core' or 'modules'.
	 * @param {string} identifier The data identifier, for example a module slug.
	 * @param {string} datapoint  The datapoint.
	 */
	invalidateCacheGroup( type, identifier, datapoint ) {
		const groupPrefix = getCacheKey( type, identifier, datapoint );

		lazilySetupLocalCache();

		Object.keys( global.googlesitekit.admin.datacache ).forEach( ( key ) => {
			if ( 0 === key.indexOf( groupPrefix + '::' ) || key === groupPrefix ) {
				delete global.googlesitekit.admin.datacache[ key ];
			}
		} );

		Object.keys( getStorage() ).forEach( ( key ) => {
			if ( 0 === key.indexOf( `googlesitekit_${ groupPrefix }::` ) || key === `googlesitekit_${ groupPrefix }` ) {
				getStorage().removeItem( key );
			}
		} );
	},

	/**
	 * Collects the initial module data request.
	 *
	 * @param {string} context The context to retrieve the module data for. One of 'Dashboard', 'Settings',
	 *                         or 'Post'.
	 * @param {Object} moduleArgs Arguments passed from the module.
	 *
	 */
	collectModuleData( context, moduleArgs ) {
		/**
		 * Filter the data requested on the dashboard page once it loads.
		 *
		 * Modules use this filter to attach the datapoints they need to resolve after page load.
		 *
		 * @param array datapoints The datapoints to retrieve.
		 */
		const requestedModuleData = applyFilters( 'googlesitekit.module' + context + 'DataRequest', [], moduleArgs );

		if ( 0 !== requestedModuleData.length ) {
			this.combinedGet( requestedModuleData );
		}
	},

	/**
	 * Gets data using the REST API.
	 *
	 * @param {string}  type       The data to access. One of 'core' or 'modules'.
	 * @param {string}  identifier The data identifier, for example a module slug.
	 * @param {string}  datapoint  The datapoint.
	 * @param {Object}  data       Optional arguments to pass along.
	 * @param {boolean} nocache    Set to true to bypass cache, default: true.
	 *
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
		} ).catch( ( err ) => {
			this.handleWPError( err );

			return Promise.reject( err );
		} );
	},

	/**
	 * Sets data using the REST API.
	 *
	 * @param {string} type       The data to access. One of 'core' or 'modules'.
	 * @param {string} identifier The data identifier, for example a module slug.
	 * @param {string} datapoint  The datapoint.
	 * @param {Object} data       The data to set.
	 *
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
		} );
	},
	/**
	 * Sets a module to activated or deactivated using the REST API.
	 *
	 * @param {string}  slug   The module slug.
	 * @param {boolean} active Whether the module should be active or not.
	 *
	 * @return {Promise} A promise for the fetch request.
	 */
	setModuleActive( slug, active ) {
		return this.set( TYPE_CORE, 'modules', 'activation', { slug, active } );
	},
};

// Init data module once.
dataAPI.init();

export default dataAPI;
