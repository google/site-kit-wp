/**
 * `modules/analytics-4` data store: properties.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME, PROPERTY_CREATE, MAX_WEBDATASTREAMS_PER_BATCH } from './constants';
import { normalizeURL } from '../../../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { isValidPropertySelection } from '../utils/validation';
import { actions as webDataStreamActions } from './webdatastreams';
const { commonActions } = Data;

const fetchGetPropertyStore = createFetchStore( {
	baseName: 'getProperty',
	controlCallback( { propertyID } ) {
		return API.get( 'modules', 'analytics-4', 'property', { propertyID }, {
			useCache: true,
		} );
	},
	reducerCallback( state, property, { propertyID } ) {
		return {
			...state,
			propertiesByID: {
				...state.propertiesByID,
				[ propertyID ]: property,
			},
		};
	},
	argsToParams( propertyID ) {
		return { propertyID };
	},
	validateParams( { propertyID } = {} ) {
		invariant( propertyID, 'propertyID is required.' );
	},
} );

const fetchGetPropertiesStore = createFetchStore( {
	baseName: 'getProperties',
	controlCallback( { accountID } ) {
		return API.get( 'modules', 'analytics-4', 'properties', { accountID }, {
			useCache: true,
		} );
	},
	reducerCallback( state, properties, { accountID } ) {
		return {
			...state,
			properties: {
				...state.properties,
				[ accountID ]: properties,
			},
			propertiesByID: properties.reduce(
				( accum, property ) => ( { ...accum, [ property._id ]: property } ),
				state.propertiesByID || {},
			),
		};
	},
	argsToParams( accountID ) {
		return { accountID };
	},
	validateParams( { accountID } = {} ) {
		invariant( accountID, 'accountID is required.' );
	},
} );

const fetchCreatePropertyStore = createFetchStore( {
	baseName: 'createProperty',
	controlCallback( { accountID } ) {
		return API.set( 'modules', 'analytics-4', 'create-property', { accountID } );
	},
	reducerCallback( state, property, { accountID } ) {
		return {
			...state,
			properties: {
				...state.properties,
				[ accountID ]: [
					...( state.properties[ accountID ] || [] ),
					property,
				],
			},
		};
	},
	argsToParams( accountID ) {
		return { accountID };
	},
	validateParams( { accountID } = {} ) {
		invariant( accountID, 'accountID is required.' );
	},
} );

const baseInitialState = {
	properties: {},
	propertiesByID: {},
};

const baseActions = {
	/**
	 * Creates a new GA4 property.
	 *
	 * @since 1.31.0
	 *
	 * @param {string} accountID Analytics account ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	createProperty( accountID ) {
		invariant( accountID, 'accountID is required.' );

		return ( function*() {
			const { response, error } = yield fetchCreatePropertyStore.actions.fetchCreateProperty( accountID );
			return { response, error };
		}() );
	},

	/**
	 * Sets the given property and related fields in the store.
	 *
	 * @since 1.31.0
	 *
	 * @param {string} propertyID GA4 property ID.
	 * @return {Object} A Generator function.
	 */
	selectProperty( propertyID ) {
		invariant( isValidPropertySelection( propertyID ), 'A valid propertyID selection is required.' );

		return ( function* () {
			const registry = yield Data.commonActions.getRegistry();

			registry.dispatch( STORE_NAME ).setPropertyID( propertyID );
			registry.dispatch( STORE_NAME ).setWebDataStreamID( '' );
			registry.dispatch( STORE_NAME ).setMeasurementID( '' );

			if ( PROPERTY_CREATE === propertyID ) {
				return;
			}

			yield webDataStreamActions.waitForWebDataStreams( propertyID );

			const webdatastream = registry.select( STORE_NAME ).getMatchingWebDataStream( propertyID );
			if ( webdatastream ) {
				registry.dispatch( STORE_NAME ).setWebDataStreamID( webdatastream._id );
				registry.dispatch( STORE_NAME ).setMeasurementID( webdatastream.measurementId ); // eslint-disable-line sitekit/acronym-case
			}
		}() );
	},

	/**
	 * Matches a property by URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array.<number>}        properties Array of property IDs.
	 * @param {Array.<string>|string} url        A list of URLs or a signle URL to match properties.
	 * @return {Object} A property object if found.
	 */
	*matchPropertyByURL( properties, url ) {
		const registry = yield commonActions.getRegistry();
		const urls = ( Array.isArray( url ) ? url : [ url ] ).map( normalizeURL );

		for ( let i = 0; i < properties.length; i += MAX_WEBDATASTREAMS_PER_BATCH ) {
			const chunk = properties.slice( i, i + MAX_WEBDATASTREAMS_PER_BATCH );
			const webdatastreams = yield commonActions.await(
				registry.__experimentalResolveSelect( STORE_NAME ).getWebDataStreamsBatch( chunk ),
			);

			for ( const propertyID in webdatastreams ) {
				for ( const webdatastream of webdatastreams[ propertyID ] ) {
					for ( const singleURL of urls ) {
						if ( singleURL === normalizeURL( webdatastream.defaultUri ) ) {
							return yield commonActions.await(
								registry.__experimentalResolveSelect( STORE_NAME ).getProperty( propertyID ),
							);
						}
					}
				}
			}
		}

		return null;
	},
};

const baseControls = {
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getProperties( accountID ) {
		const registry = yield Data.commonActions.getRegistry();
		// Only fetch properties if there are none in the store for the given account.
		const properties = registry.select( STORE_NAME ).getProperties( accountID );
		if ( properties === undefined ) {
			yield fetchGetPropertiesStore.actions.fetchGetProperties( accountID );
		}
	},
	*getProperty( propertyID ) {
		const registry = yield Data.commonActions.getRegistry();
		const property = registry.select( STORE_NAME ).getProperty( propertyID );
		if ( property === undefined ) {
			yield fetchGetPropertyStore.actions.fetchGetProperty( propertyID );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all GA4 properties this account can access.
	 *
	 * @since 1.31.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The GA4 Account ID to fetch properties for.
	 * @return {(Array.<Object>|undefined)} An array of GA4 properties; `undefined` if not loaded.
	 */
	getProperties( state, accountID ) {
		return state.properties[ accountID ];
	},

	/**
	 * Gets a property with specific ID.
	 *
	 * @since 1.31.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The GA4 property ID to fetch property object for.
	 * @return {(Object|undefined)} A property object; `undefined` if not loaded.
	 */
	getProperty( state, propertyID ) {
		return state.propertiesByID[ propertyID ];
	},
};

const store = Data.combineStores(
	fetchCreatePropertyStore,
	fetchGetPropertiesStore,
	fetchGetPropertyStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
