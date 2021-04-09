/**
 * `modules/analytics-4` data store: webdatastreams.
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
import { STORE_NAME } from './constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { createRegistryControl, createRegistrySelector } = Data;

const fetchGetWebDataStreamsStore = createFetchStore( {
	baseName: 'getWebDataStreams',
	controlCallback( { propertyID } ) {
		return API.get( 'modules', 'analytics-4', 'webdatastreams', { propertyID }, {
			useCache: true,
		} );
	},
	reducerCallback( state, webDataStreams, { propertyID } ) {
		return {
			...state,
			webdatastreams: {
				...state.webdatastreams,
				[ propertyID ]: webDataStreams,
			},
		};
	},
	argsToParams( propertyID ) {
		return { propertyID };
	},
	validateParams( { propertyID } = {} ) {
		invariant( propertyID, 'GA4 propertyID is required.' );
	},
} );

const fetchCreateWebDataStreamStore = createFetchStore( {
	baseName: 'createWebDataStream',
	controlCallback( { propertyID } ) {
		return API.set( 'modules', 'analytics-4', 'create-webdatastream', { propertyID } );
	},
	reducerCallback( state, webDataStream, { propertyID } ) {
		return {
			...state,
			webdatastreams: {
				...state.webdatastreams,
				[ propertyID ]: [
					...( state.webdatastreams[ propertyID ] || [] ),
					webDataStream,
				],
			},
		};
	},
	argsToParams( propertyID ) {
		return { propertyID };
	},
	validateParams( { propertyID } = {} ) {
		invariant( propertyID, 'GA4 propertyID is required.' );
	},
} );

// Actions
const WAIT_FOR_WEBDATASTREAMS = 'WAIT_FOR_WEBDATASTREAMS';

const baseInitialState = {
	webdatastreams: {},
};

const baseActions = {
	/**
	 * Creates a new GA4 web data stream.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} propertyID GA4 property ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	*createWebDataStream( propertyID ) {
		invariant( propertyID, 'GA4 propertyID is required.' );

		const { response, error } = yield fetchCreateWebDataStreamStore.actions.fetchCreateWebDataStream( propertyID );
		return { response, error };
	},

	/**
	 * Waits for web data streams to be loaded for a property.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} propertyID GA4 property ID.
	 * @return {Object} Redux action.
	 */
	waitForWebDataStreams( propertyID ) {
		return {
			payload: { propertyID },
			type: WAIT_FOR_WEBDATASTREAMS,
		};
	},
};

const baseControls = {
	[ WAIT_FOR_WEBDATASTREAMS ]: createRegistryControl( ( { select, subscribe } ) => {
		return ( { payload } ) => {
			const { propertyID } = payload;
			const areLoaded = () => select( STORE_NAME ).getWebDataStreams( propertyID ) !== undefined;

			if ( areLoaded() ) {
				return true;
			}

			return new Promise( ( resolve ) => {
				const unsubscribe = subscribe( () => {
					if ( areLoaded() ) {
						unsubscribe();
						resolve();
					}
				} );
			} );
		};
	} ),
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getWebDataStreams( propertyID ) {
		const registry = yield Data.commonActions.getRegistry();
		// Only fetch web data streams if there are none in the store for the given property.
		const webdatastreams = registry.select( STORE_NAME ).getWebDataStreams( propertyID );
		if ( webdatastreams === undefined ) {
			yield fetchGetWebDataStreamsStore.actions.fetchGetWebDataStreams( propertyID );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all GA4 web data streams this account can access.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The GA4 property ID to fetch web data streams for.
	 * @return {(Array.<Object>|undefined)} An array of GA4 web data streams; `undefined` if not loaded.
	 */
	getWebDataStreams( state, propertyID ) {
		return state.webdatastreams[ propertyID ];
	},

	/**
	 * Gets matched web data stream for selected property.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The GA4 property ID to find matched web data stream.
	 * @return {(Object|null|undefined)} A web data stream object if found, otherwise null; `undefined` if web data streams are not loaded.
	 */
	getMatchingWebDataStream: createRegistrySelector( ( select ) => ( state, propertyID ) => {
		const datastreams = select( STORE_NAME ).getWebDataStreams( propertyID );
		if ( datastreams === undefined ) {
			return undefined;
		}

		if ( Array.isArray( datastreams ) ) {
			const normalizeURL = ( incomingURL ) => incomingURL
				.replace( /^https?:\/\/(www\.)?/i, '' ) // Remove protocol and optional "www." prefix from the URL.
				.replace( /\/$/, '' ); // Remove trailing slash.

			const url = normalizeURL( select( CORE_SITE ).getReferenceSiteURL() );
			for ( const datastream of datastreams ) {
				if ( normalizeURL( datastream.defaultUri ) === url ) {
					return datastream;
				}
			}
		}

		return null;
	} ),
};

const store = Data.combineStores(
	fetchGetWebDataStreamsStore,
	fetchCreateWebDataStreamStore,
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
