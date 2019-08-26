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
import DashboardAuthAlert from 'GoogleComponents/notifications/dashboard-auth-alert';
import DashboardPermissionAlert from 'GoogleComponents/notifications/dashboard-permission-alert';
import md5 from 'md5';

import {
	storageAvailable,
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
 * @param {Object} data The data object to sort.
 * @return {Object} The sorted data object.
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

/**
 * Ensures that the local datacache object is properly set up.
 */
const lazilySetupLocalCache = () => {
	googlesitekit.admin = googlesitekit.admin || {};

	if ( 'string' === typeof googlesitekit.admin.datacache ) {
		googlesitekit.admin.datacache = JSON.parse( googlesitekit.admin.datacache );
	}

	if ( 'object' !== typeof googlesitekit.admin.datacache ) {
		googlesitekit.admin.datacache = {};
	}
};

/**
 * Detects whether and which persistent cache storage is available.
 *
 * @return {mixed} Either 'sessionStorage', 'localStorage', or undefined.
 */
const detectPersistentCache = () => {
	if ( storageAvailable( 'sessionStorage' ) ) {
		return 'sessionStorage';
	}

	if ( storageAvailable( 'localStorage' ) ) {
		return 'localStorage';
	}

	return undefined;
};

const dataAPI = {

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
	 * Gets data for multiple requests from the cache in a single batch process.
	 *
	 * This is a replica of combinedGet but only fetching data from cache. No requests are done.
	 * Solves issue for publisher wins to retrieve data without performing additional requests.
	 * Likely this will be removed after refactoring.
	 *
 	 * @param {Array.<{ maxAge: timestamp, type: string, identifier: string, datapoint: string, callback: function }>} combinedRequest An array of data requests to resolve.
	 *
	 * @return {Promise} A promise for the cache lookup.
	 */
	combinedGetFromCache( combinedRequest ) {
		return new Promise( ( resolve, reject ) => {
			try {
				const responseData = [];

				/**
				 * Filter the date range used for queries.
				 *
				 * @param String The selected date range. Default 'Last 28 days'.
				 */
				const dateRangeSlug = stringToSlug( applyFilters( 'googlesitekit.dateRange', __( 'Last 28 days', 'google-site-kit' ) ) );
				each( combinedRequest, ( request ) => {
					request.data = request.data || {};
					request.data.dateRange = request.data.dateRange || dateRangeSlug;

					const paramsToMigrate = [ 'permaLink', 'siteURL', 'pageUrl', 'limit' ];
					paramsToMigrate.forEach( ( param ) => {
						if ( 'undefined' !== typeof request[ param ] ) {
							request.data[ param ] = request[ param ];
							delete request[ param ];
						}
					} );

					request.key = this.getCacheKey( request.type, request.identifier, request.datapoint, request.data );

					const cache = this.getCache( request.key, request.maxAge );
					if ( 'undefined' !== typeof cache ) {
						responseData[ request.key ] = cache;

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
	 * Gets data for multiple requests from the REST API using a single batch process.
	 *
 	 * @param {Array.<{ maxAge: timestamp, type: string, identifier: string, datapoint: string, callback: function }>} combinedRequest An array of data requests to resolve.
	 * @param {boolean} secondaryRequest Is this the second (or more) request?
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
			request.data = request.data || {};
			request.data.dateRange = request.data.dateRange || dateRangeSlug;

			const paramsToMigrate = [ 'permaLink', 'siteURL', 'pageUrl', 'limit' ];
			paramsToMigrate.forEach( ( param ) => {
				if ( 'undefined' !== typeof request[ param ] ) {
					request.data[ param ] = request[ param ];
					delete request[ param ];
				}
			} );

			request.key = this.getCacheKey( request.type, request.identifier, request.datapoint, request.data );

			const cache = this.getCache( request.key, request.maxAge );
			if ( 'undefined' !== typeof cache ) {
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
		const toRequest = [];
		const deferredRequests = [];
		const keyIndexesMap = {};
		each( dataRequest, ( request, index ) => {
			// Defer any datapoints with a priority of 10 or greater into a second request.
			if ( ! secondaryRequest && 10 <= request.priority ) {
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
						result.error_data[ 403 ] &&
						result.error_data[ 403 ].reason
					) {
						if ( 'insufficientPermissions' === result.error_data[ 403 ].reason ) {
							// Insufficient scopes - add a notice.
							addFilter( 'googlesitekit.DashboardNotifications',
								'googlesitekit.AuthNotification',
								fillFilterWithComponent( DashboardAuthAlert ), 1 );
						} else if ( 'forbidden' === result.error_data[ 403 ].reason ) {
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

					each( keyIndexesMap[ key ], ( index ) => {
						const request = dataRequest[ index ];

						doAction( 'googlesitekit.dataReceived', request.key );

						this.setCache( request.key, result );
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
	 * Sets data in the cache.
	 *
	 * @param {string} key  The cache key,
	 * @param {mixed}  data The data to cache.
	 */
	setCache( key, data ) {
		if ( 'undefined' === typeof data ) {
			return;
		}

		// Specific workaround to ensure no error responses are cached.
		if ( data && 'object' === typeof data && ( data.error || data.errors ) ) {
			return;
		}

		lazilySetupLocalCache();

		googlesitekit.admin.datacache[ key ] = data;

		const storage = detectPersistentCache();
		if ( ! storage ) {
			return;
		}

		const toStore = {
			value: data,
			date: Date.now() / 1000,
		};
		window[ storage ].setItem( 'googlesitekit_' + key, JSON.stringify( toStore ) );
	},

	/**
	 * Gets data from the cache.
	 *
	 * @param {string} key    The cache key,
	 * @param {number} maxAge The cache TTL in seconds. If not provided, no TTL will be checked.
	 *
	 * @return {mixed} Cached data, or undefined if lookup failed.
	 */
	getCache( key, maxAge ) {
		// Skip if js caching is disabled.
		if ( googlesitekit.admin.nojscache ) {
			return undefined;
		}

		lazilySetupLocalCache();

		// Check variable cache first.
		if ( 'undefined' !== typeof googlesitekit.admin.datacache[ key ] ) {
			return googlesitekit.admin.datacache[ key ];
		}

		const storage = detectPersistentCache();
		if ( ! storage ) {
			return undefined;
		}

		// Check persistent cache.
		const cache = JSON.parse( window[ storage ].getItem( 'googlesitekit_' + key ) );
		if ( cache && 'object' === typeof cache && cache.date ) {
			// Only return value if no maximum age given or value is newer than it.
			if ( ! maxAge || ( Date.now() / 1000 ) - cache.date < maxAge ) {
				// Set variable cache.
				googlesitekit.admin.datacache[ key ] = cache.value;

				return cache.value;
			}
		}

		return undefined;
	},

	/**
	 * Removes data from the cache.
	 *
	 * @param {string} key The cache key,
	 */
	deleteCache( key ) {
		lazilySetupLocalCache();

		if ( 'undefined' !== typeof googlesitekit.admin.datacache[ key ] ) {
			delete googlesitekit.admin.datacache[ key ];
		}

		const storage = detectPersistentCache();
		if ( ! storage ) {
			return;
		}

		window[ storage ].removeItem( 'googlesitekit_' + key );
	},

	/**
	 * Invalidates all caches associated with a specific cache group.
	 *
	 * @param {string} type       The data to access. One of 'core' or 'modules'.
	 * @param {string} identifier The data identifier, for example a module slug.
	 * @param {string} datapoint  The datapoint.
	 */
	invalidateCacheGroup( type, identifier, datapoint ) {
		const groupPrefix = this.getCacheKey( type, identifier, datapoint );

		lazilySetupLocalCache();

		Object.keys( googlesitekit.admin.datacache ).forEach( ( key ) => {
			if ( 0 === key.indexOf( groupPrefix + '::' ) || key === groupPrefix ) {
				delete googlesitekit.admin.datacache[ key ];
			}
		} );

		const storage = detectPersistentCache();
		if ( ! storage ) {
			return;
		}

		Object.keys( window[ storage ] ).forEach( ( key ) => {
			if ( 0 === key.indexOf( 'googlesitekit_' + groupPrefix + '::' ) || key === 'googlesitekit_' + groupPrefix ) {
				window[ storage ].removeItem( key );
			}
		} );
	},

	/**
	 * Collects the initial module data request.
	 *
	 * @param {string} context The context to retrieve the module data for. One of 'Dashboard', 'Settings',
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
		const cacheKey = this.getCacheKey( type, identifier, datapoint, data );

		if ( ! nocache ) {
			const cache = this.getCache( cacheKey, 3600 );

			if ( 'undefined' !== typeof cache ) {
				return new Promise( ( resolve ) => {
					resolve( cache );
				} );
			}
		}

		// Make an API request to retrieve the results.
		return wp.apiFetch( {
			path: addQueryArgs( `/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`, data ),
		} ).then( ( results ) => {
			if ( ! nocache ) {
				this.setCache( cacheKey, results );
			}

			return new Promise( ( resolve ) => {
				resolve( results );
			} );
		} ).catch( ( err ) => {
			return Promise.reject( err );
		} );
	},

	/**
	 * Gets notifications from Rest API.
	 *
	 * @param {string} moduleSlug Slug of the module to get notifications for.
	 * @param {number} maxAge     The cache TTL in seconds. If not provided, no TTL will be checked.
	 *
	 * @return {Promise} A promise for the fetch request.
	 */
	async getNotifications( moduleSlug, maxAge = 0 ) {
		let notifications = [];

		if ( ! moduleSlug ) {
			return notifications;
		}

		const cacheKey = this.getCacheKey( 'modules', moduleSlug, 'notifications' );

		notifications = dataAPI.getCache( cacheKey, maxAge );

		if ( ! notifications || 0 === notifications.length ) {
			// Make an API request to retrieve the notifications.
			notifications = await wp.apiFetch( {
				path: `/google-site-kit/v1/modules/${ moduleSlug }/notifications/`,
			} );

			dataAPI.setCache( cacheKey, notifications );
		}

		return notifications;
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
		return wp.apiFetch( { path: `/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`,
			data: body,
			method: 'POST',
		} ).then( ( response ) => {
			dataAPI.invalidateCacheGroup( type, identifier, datapoint );

			return new Promise( ( resolve ) => {
				resolve( response );
			} );
		} ).catch( ( err ) => {
			return Promise.reject( err );
		} );
	},

	/**
	 * Returns a consistent cache key for the given arguments.
	 *
	 * @param {string}  type       The data type. Either 'core' or 'modules'.
	 * @param {string}  identifier The data identifier, for example a module slug.
	 * @param {string}  datapoint  The datapoint.
	 * @param {Object?} data       Optional arguments to pass along.
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
	 * Sets a module to activated or deactivated using the REST API.
	 *
	 * @param {string}  moduleSlug The module slug.
	 * @param {boolean} active     Whether the module should be active or not.
	 */
	setModuleActive( moduleSlug, active ) {
		// Make an API request to store the value.
		return wp.apiFetch( { path: `/google-site-kit/v1/modules/${ moduleSlug }`,
			data: { active },
			method: 'POST',
		} ).then( ( response ) => {
			return new Promise( ( resolve ) => {
				resolve( response );
			} );
		} ).catch( ( err ) => {
			return Promise.reject( err );
		} );
	},
};

// Init data module once.
dataAPI.init();

export default dataAPI;
