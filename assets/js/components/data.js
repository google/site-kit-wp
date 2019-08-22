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
import DashboardAuthAlert from 'GoogleComponents/notifications/dashboard-auth-alert';
import DashboardPermissionAlert from 'GoogleComponents/notifications/dashboard-permission-alert';
import md5 from 'md5';

import {
	setCache,
	stringToSlug,
	fillFilterWithComponent,
} from 'SiteKitCore/util';

const { each, sortBy } = lodash;
const { addQueryArgs } = wp.url;
const {
	addAction,
	applyFilters,
	doAction,
	addFilter,
	removeFilter,
} = wp.hooks;
const { __ } = wp.i18n;

/**
 * Sorts an object by its keys.
 *
 * The returned value will be a sorted copy of the input object.
 * Any inner objects will also be sorted recursively.
 *
 * @param {object} data The data object to sort.
 * @return {object} The sorted data object.
 */
const sortObjectProperties = ( data ) => {
	const orderedData = {};
	Object.keys( data ).sort().forEach( ( key ) => {
		let val = data[ key ];
		if ( val && 'object' === typeof val && ! Array.isArray( val ) ) {
			val = sortObjectProperties( val );
		}
		orderedData[ key ] = val;
	} );
	return orderedData;
};

const data = {

	maxRequests: 10,

	init() {
		if ( googlesitekit.initialized ) {
			return;
		}
		googlesitekit.initialized = true;
		this.collectModuleData = this.collectModuleData.bind( this );
		googlesitekit.cache = [];

		addAction(
			'googlesitekit.moduleLoaded',
			'googlesitekit.collectModuleListingData',
			this.collectModuleData
		);
	},

	/**
	 * Retrieve an array of data objects.
	 * This is a replica of combinedGet but only fetching data from cache. No requests are done.
	 * Solves issue for publisher wins to retrieve data without performing additional requests.
	 * Likely this will be removed after refactoring.
	 *
 	 * @param {Array.<{ maxAge: timestamp, dataObject: string, identifier: string, datapoint: string, datapointId: int, callback: function }>} combinedRequest An array of data requests to resolve.
	 *
	 * @return Promise
	 */
	combinedGetFromCache( combinedRequest ) {
		return new Promise( ( resolve, reject ) => {
			try {

				let responseData = [];

				/**
				 * Filter the date range used for queries.
				 *
				 * @param String The selected date range. Default 'Last 28 days'.
				 */
				const dateRangeSlug = stringToSlug( applyFilters( 'googlesitekit.dateRange', __( 'Last 28 days', 'google-site-kit' ) ) );
				each( combinedRequest, ( request ) => {
					let key = [ request.identifier, request.datapoint ];
					if ( request.datapointId ) {
						key = [ ...key, request.datapointId ];
					}

					// Setup new request format from old request format.
					if ( ! request.data ) {
						request.data = {};
					}
					request.data.date_range = dateRangeSlug; // eslint-disable-line camelcase
					const paramsToMigrate = [ 'permaLink', 'siteURL', 'pageUrl', 'limit' ];
					paramsToMigrate.forEach( param => {
						if ( 'undefined' !== typeof request[ param ] ) {
							request.data[ param ] = request[ param ];
							delete request[ param ];
						}
					} );

					// Add the date range to the cache key.
					key = [
						...key,
						dateRangeSlug,
					];

					key = key.join( '::' );
					const hashlessKey = key;

					const { permaLinkHash } = googlesitekit;
					if ( permaLinkHash && '' !== permaLinkHash ) {
						key = key + '::' + permaLinkHash;
					}

					// Store key for later reuse.
					request.key = key;
					const cache = this.getCache( request.dataObject, key, request.maxAge, hashlessKey );
					if ( cache ) {
						responseData[ hashlessKey ] = cache;

						// Trigger an action when cached data is used.
						doAction( 'googlesitekit.cachedDataUsed', request.datapoint );

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
	 * Retrieve an array of data objects.
	 *
 	 * @param {Array.<{ maxAge: timestamp, dataObject: string, identifier: string, datapoint: string, datapointId: int, callback: function }>} combinedRequest An array of data requests to resolve.
	 * @param {boolean} secondaryRequest Is this the second (or more) request?
	 *
	 * @return void
	 */
	combinedGet( combinedRequest, secondaryRequest = false ) {

		// First, resolve any cache matches immediately, queue resolution of the rest.
		let dataRequest = [];

		/**
		 * Filter the date range used for queries.
		 *
		 * @param String The selected date range. Default 'Last 28 days'.
		 */
		const dateRangeSlug = stringToSlug( applyFilters( 'googlesitekit.dateRange', __( 'Last 28 days', 'google-site-kit' ) ) );
		let cacheDelay = 25;
		each( combinedRequest, ( request ) => {
			let key = [ request.identifier, request.datapoint ];
			if ( request.datapointId ) {
				key = [ ...key, request.datapointId ];
			}

			// Setup new request format from old request format.
			if ( ! request.data ) {
				request.data = {};
			}
			request.data.date_range = dateRangeSlug; // eslint-disable-line camelcase
			const paramsToMigrate = [ 'permaLink', 'siteURL', 'pageUrl', 'limit' ];
			paramsToMigrate.forEach( param => {
				if ( 'undefined' !== typeof request[ param ] ) {
					request.data[ param ] = request[ param ];
					delete request[ param ];
				}
			} );

			// Add the date range to the cache key.
			key = [
				...key,
				dateRangeSlug,
			];

			key = key.join( '::' );
			const hashlessKey = key;

			const { permaLinkHash } = googlesitekit;
			if ( permaLinkHash && '' !== permaLinkHash ) {
				key = key + '::' + permaLinkHash;
			}

			// Store key for later reuse.
			request.key = key;
			const cache = this.getCache( request.dataObject, key, request.maxAge, hashlessKey );
			if ( cache ) {

				setTimeout( () => {

					// Trigger an action when cached data is used.
					doAction( 'googlesitekit.cachedDataUsed', request.datapoint );

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
		const toRequest        = [];
		const deferredRequests = [];
		const keyIndexesMap    = {};
		each ( dataRequest, ( request, index ) => {

			// Defer any datapoints with a priority of 10 or greater into a second request.
			if ( ! secondaryRequest && 10 <= request.priority ) {
				deferredRequests.push( request );
			} else {
				if ( ! keyIndexesMap[ request.key ] ) {
					keyIndexesMap[ request.key ] = [ index ];
					toRequest.push( request );
				} else {
					keyIndexesMap[ request.key ].push( index );
				}
			}
		} );


		const maxDatapointsPerRequest = 10;
		const currentRequest          = toRequest.slice( 0, maxDatapointsPerRequest );
		let remainingDatapoints       = toRequest.slice( maxDatapointsPerRequest );

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

		const { datacache } = googlesitekit.admin;
		return wp.apiFetch( {
			path: addQueryArgs( `/google-site-kit/v1/data/${ datacache ? '?datacache' : '' }`,
				{
					request: JSON.stringify( currentRequest ),
				} ),
			method: 'GET',
		} ).then( ( results ) => {
			each( results, ( result, key ) => {
				if ( result.xdebug_message ) {
					console.log( 'data_error', result.xdebug_message ); // eslint-disable-line no-console
				} else {
					if ( ! keyIndexesMap[ key ] ) {
						console.log( 'data_error', 'unknown response key ' + key ); // eslint-disable-line no-console
						return;
					}

					// Handle insufficient scope warnings by informing the user.
					if (
						result.error_data &&
						result.error_data[403] &&
						result.error_data[403].reason
					)  {

						if ( 'insufficientPermissions' === result.error_data[403].reason ) {

							// Insufficient scopes - add a notice.
							addFilter( 'googlesitekit.DashboardNotifications',
								'googlesitekit.AuthNotification',
								fillFilterWithComponent( DashboardAuthAlert ), 1 );
						} else if ( 'forbidden' === result.error_data[403].reason ) {

							// Insufficient access permissions - add a notice.
							addFilter( 'googlesitekit.DashboardNotifications',
								'googlesitekit.AuthNotification',
								fillFilterWithComponent( DashboardPermissionAlert ), 1 );

						}

						// Increase the notice count.
						addFilter( 'googlesitekit.TotalNotifications',
							'googlesitekit.AuthCountIncrease', ( count ) => {

								// Only run once.
								removeFilter( 'googlesitekit.TotalNotifications', 'googlesitekit.AuthCountIncrease' );
								return count + 1;
							} );
					}

					each( keyIndexesMap[ key ], index => {
						const request = dataRequest[ index ];

						doAction( 'googlesitekit.dataReceived', request.key );

						this.setCache( request.dataObject, request.key, result );
						this.resolve( request, result );
					} );
				}

				// Trigger an action indicating this data load completed from the API.
				if ( 0 === remainingDatapoints.length ) {
					doAction( 'googlesitekit.dataLoaded', 'api' );
				}
			} );

			// Resolve any returned data requests, then re-request the remainder after a pause.
		} ).catch( ( err ) => {

			// Handle the error and give up trying.
			console.log( 'error', err ); // eslint-disable-line no-console
		} );
	},

	/**
	 * Resolve a request.
	 */
	resolve( request, result ) {

		// Call the resolver callback with the data.
		if ( request && 'function' === typeof request.callback ) {
			request.callback( result, request.datapoint );
		}
	},

	/**
	 * Set cache to window sessionStorage.
	 *
	 * @param {object} dataObject The data object.
	 * @param {string} key        The cache key,
	 * @param {object} value      The value to cache.
	 */
	setCache( dataObject, key, value ) {
		if ( value.error || value.errors ) {
			return;
		}

		if ( window.sessionStorage ) {
			const toStore = {
				value,
				date: Date.now() / 1000
			};
			setCache( 'sessionStorage', dataObject + '::' + key, JSON.stringify( toStore ) );
		}
	},

	/**
	 *
	 * @param {object} dataObject The data object.
	 * @param {string} key        The cache key,
	 * @param {int}    maxAge     The cache TTL in seconds.
	 */
	getCache( dataObject, key, maxAge, hashlessKey = '' ) {

		// Skip if js caching is disabled.
		if ( googlesitekit.admin.nojscache ) {
			return false;
		}

		// Require sessionStorage for local caching.
		if ( ! window.sessionStorage ) {
			return false;
		}

		const cache = JSON.parse( window.sessionStorage.getItem( dataObject + '::' + key ) );
		const datacache = googlesitekit.admin.datacache && JSON.parse( googlesitekit.admin.datacache );

		// Check the datacache, which only includes fresh data at load.
		if ( ! cache && datacache && datacache[ 'googlesitekit_' + key ] ) {
			return datacache[ 'googlesitekit_' + key ];
		}

		// Check the datacache, which only includes fresh data at load.
		if ( ! cache && datacache && datacache[ 'googlesitekit_' + hashlessKey ] ) {
			return datacache[ 'googlesitekit_' + hashlessKey ];
		}

		if ( ! cache ) {
			return false;
		}

		const age = ( Date.now() / 1000 ) - cache.date;
		if ( age < maxAge ) {
			return cache.value;
		}
		return false;
	},

	/**
	 * Remove cache.
	 *
	 * @param {object} dataObject The data object.
	 * @param {string} key        The cache key,
	 */
	deleteCache( dataObject, key ) {
		if ( window.sessionStorage ) {
			window.sessionStorage.removeItem( dataObject + '::' + key );
		}
	},

	/**
	 *  Collect the initial module data request.
	 *
	 * @param {string} context   The context to retrieve the module data for. One of 'Dashboard', 'Settings',
	 *                         or 'Post'.
	 * @param {mixed} moduleArgs Arguments passed from the module.
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
	 * Get a data object.
	 *
	 * @param {string} dataObject  The data object to access. One of 'modules' or 'settings'.
	 * @param {string} identifier  The data item identifier.
	 * @param {string} datapoint   The data point to retrieve. Optional, otherwise returns all data.
	 * @param {object} queryArgs   The data query arguments.
	 * @param {bool}   nocache     Set to true to bypass cache, default: true.
	 *
	 * @returns Promise A promise for the fetch request.
	 */
	get( dataObject, identifier, datapoint, queryArgs = {}, nocache = true ) {

		if ( ! nocache ) {
			const cache = this.getCache( identifier, datapoint, 3600 );

			if ( cache ) {
				googlesitekit[ dataObject ][ identifier ][ datapoint ] = cache;
			}
			if ( googlesitekit[ dataObject ] &&
				googlesitekit[ dataObject ][ identifier ] &&
				googlesitekit[ dataObject ][ identifier ][ datapoint ] ) {
				return new Promise( ( resolve ) => {
					resolve( googlesitekit[ dataObject ][ identifier ][ datapoint ] );
				} );
			}
		}

		// Make an API request to retrieve the value.
		return wp.apiFetch( {
			path: addQueryArgs( `/google-site-kit/v1/${dataObject}/${identifier}/data/${datapoint}`, queryArgs )
		} ).then( ( results ) => {
			if ( ! nocache ) {
				this.setCache( identifier, datapoint, results );
			}

			if ( googlesitekit[ dataObject ] &&
					googlesitekit[ dataObject ][ identifier ] &&
					googlesitekit[ dataObject ][ identifier ][ datapoint ] ) {

				googlesitekit[dataObject][identifier][datapoint] = results;

				return new Promise( ( resolve ) => {
					resolve( googlesitekit[dataObject][identifier][datapoint] );
				} );
			}

			return new Promise( ( resolve ) => {
				resolve( results );
			} );
		} ).catch( ( err ) => {
			return Promise.reject( err );
		} );
	},

	/**
	 * Get notifications from Rest API.
	 *
	 * @param {string} moduleSlug Slug of the module to get notifications for.
	 *
	 * @returns Promise A promise for the fetch request.
	 */
	async getNotifications( moduleSlug, time = 0 ) {
		let notifications = [];

		if ( ! moduleSlug ) {
			return notifications;
		}

		notifications = data.getCache( 'googlesitekit::notifications', moduleSlug, time );

		if ( ! notifications || 0 === notifications.length ) {

			// Make an API request to retrieve the value.
			notifications = await wp.apiFetch( {
				path: `/google-site-kit/v1/modules/${ moduleSlug }/notifications/`
			} );

			data.setCache( 'googlesitekit::notifications', moduleSlug, notifications );
		}

		return notifications;
	},

	/**
	 * Set an object value.
	 *
	 * Calls the REST API to store the module value.
	 *
	 * @param {string} dataObject  The data to access. One of 'core' or 'modules'.
	 * @param {string} identifier  The data item identifier.
	 * @param {string} datapoint   The data point to set.
	 * @param {object} value       The value to store.
	 *
	 * @returns Promise A promise for the fetch request.
	 */
	set( dataObject, identifier, datapoint, value ) {

		if ( googlesitekit[ dataObject ] && googlesitekit[ dataObject ][ identifier ] ) {
			googlesitekit[ dataObject ][ identifier ][ datapoint ] = value;
		}

		const body  = {};
		body.data   = value;

		// Make an API request to store the value.
		return wp.apiFetch( { path: `/google-site-kit/v1/${dataObject}/${identifier}/data/${datapoint}`,
			data: body,
			method: 'POST',
		} );
	},

	/**
	 * Returns a consistent cache key for the given arguments.
	 *
	 * @param {string}  type       The data type. Either 'core' or 'modules'.
	 * @param {string}  identifier The data identifier, for example a module slug.
	 * @param {string}  datapoint  The datapoint.
	 * @param {object?} data       Optional arguments to pass along.
	 * @return {string} The cache key to use.
	 */
	getCacheKey( type, identifier, datapoint, data = null ) {
		let key = '';
		if ( ! type || ! type.length ) {
			return key;
		}

		key = type;
		if ( ! identifier || ! identifier.length ) {
			return key;
		}

		key += '::' + identifier;
		if ( ! datapoint || ! datapoint.length ) {
			return key;
		}

		key += '::' + datapoint;
		if ( ! data || ! Object.keys( data ).length ) {
			return key;
		}

		key += '::' + md5( JSON.stringify( sortObjectProperties( data ) ) );
		return key;
	},

	/**
	 * Get module data.
	 *
	 * @param {string} module The data item identifier.
	 * @param {string} datapoint The data point to retrieve. Optional, otherwise returns all data.
	 *
	 * @returns Promise A promise for the fetch request.
	 */
	getModuleData( module, datapoint ) {
		return this.get( 'modules', module, datapoint );
	},

	/**
	 * Set module data value.
	 *
	 * Calls the REST API to store the module value.
	 *
	 * @param {string} identifier The  module.
	 * @param {string} datapoint  The data point to set
	 * @param {mixed}  value      The value to store.
	 *
	 * @returns Promise A promise for the fetch request.
	 */
	setModuleData( identifier, datapoint, value, storeLocaly = true ) {

		const dataObject = 'modules';
		const originalValue = googlesitekit[ dataObject ][ identifier ][ datapoint ];

		// Optimistically store the value locally, capturing the current value in case of failure.
		if ( storeLocaly ) {
			googlesitekit[ dataObject ][ identifier ][ datapoint ] = value;
		}

		const body      = {};
		body[datapoint] = value;

		// Make an API request to store the value.
		return wp.apiFetch( { path: `/google-site-kit/v1/${dataObject}/${identifier}`,
			data: body,
			method: 'POST',
		} ).then( ( response ) => {
			return new Promise( ( resolve ) => {
				resolve( response );
			} );
		} ).catch( ( err ) => {

			// Restore the original data when an error occurs.
			if ( storeLocaly ) {
				googlesitekit[ dataObject ][ identifier ][ datapoint ] = originalValue;
			}
			return Promise.reject( err );
		} );
	}
};

// Init data module once.
data.init();

export default data;
