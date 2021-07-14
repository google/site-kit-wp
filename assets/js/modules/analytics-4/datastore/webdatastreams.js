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
import pick from 'lodash/pick';
import difference from 'lodash/difference';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { STORE_NAME, MAX_WEBDATASTREAMS_PER_BATCH } from './constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { isValidPropertyID } from '../utils/validation';
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
				[ propertyID ]: Array.isArray( webDataStreams ) ? webDataStreams : [],
			},
		};
	},
	argsToParams( propertyID ) {
		return { propertyID };
	},
	validateParams( { propertyID } = {} ) {
		invariant( isValidPropertyID( propertyID ), 'A valid GA4 propertyID is required.' );
	},
} );

const fetchGetWebDataStreamsBatchStore = createFetchStore( {
	baseName: 'getWebDataStreamsBatch',
	controlCallback( { propertyIDs } ) {
		return API.get( 'modules', 'analytics-4', 'webdatastreams-batch', { propertyIDs }, {
			useCache: true,
		} );
	},
	reducerCallback( state, webDataStreams ) {
		return {
			...state,
			webdatastreams: {
				...state.webdatastreams,
				...( webDataStreams || {} ),
			},
		};
	},
	argsToParams( propertyIDs ) {
		return { propertyIDs };
	},
	validateParams( { propertyIDs } = {} ) {
		invariant( Array.isArray( propertyIDs ), 'GA4 propertyIDs must be an array.' );
		propertyIDs.forEach( ( propertyID ) => {
			invariant( isValidPropertyID( propertyID ), 'A valid GA4 propertyID is required.' );
		} );
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
		invariant( isValidPropertyID( propertyID ), 'A valid GA4 propertyID is required.' );
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
	 * @since 1.31.0
	 *
	 * @param {string} propertyID GA4 property ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	createWebDataStream: createValidatedAction(
		( propertyID ) => {
			invariant( propertyID, 'GA4 propertyID is required.' );
		},
		function* ( propertyID ) {
			const { response, error } = yield fetchCreateWebDataStreamStore.actions.fetchCreateWebDataStream( propertyID );
			return { response, error };
		}
	),

	/**
	 * Matches web data stream for provided property.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} propertyID GA4 property ID.
	 * @return {Object|null} Matched web data stream object on success, otherwise NULL.
	 */
	*matchWebDataStream( propertyID ) {
		yield baseActions.waitForWebDataStreams( propertyID );

		const registry = yield Data.commonActions.getRegistry();
		return registry.select( STORE_NAME ).getMatchingWebDataStream( propertyID );
	},

	/**
	 * Waits for web data streams to be loaded for a property.
	 *
	 * @since 1.31.0
	 *
	 * @param {string} propertyID GA4 property ID.
	 */
	*waitForWebDataStreams( propertyID ) {
		yield {
			payload: { propertyID },
			type: WAIT_FOR_WEBDATASTREAMS,
		};
	},
};

const baseControls = {
	[ WAIT_FOR_WEBDATASTREAMS ]: createRegistryControl( ( { __experimentalResolveSelect } ) => {
		return async ( { payload } ) => {
			const { propertyID } = payload;
			await __experimentalResolveSelect( STORE_NAME ).getWebDataStreams( propertyID );
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
	*getWebDataStreamsBatch( propertyIDs ) {
		const registry = yield Data.commonActions.getRegistry();
		const webdatastreams = registry.select( STORE_NAME ).getWebDataStreamsBatch( propertyIDs ) || {};

		const availablePropertyIDs = Object.keys( webdatastreams );
		const remainingPropertyIDs = difference( propertyIDs, availablePropertyIDs );
		if ( remainingPropertyIDs.length > 0 ) {
			for ( let i = 0; i < remainingPropertyIDs.length; i += MAX_WEBDATASTREAMS_PER_BATCH ) {
				const chunk = remainingPropertyIDs.slice( i, i + MAX_WEBDATASTREAMS_PER_BATCH );
				yield fetchGetWebDataStreamsBatchStore.actions.fetchGetWebDataStreamsBatch( chunk );
			}
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all GA4 web data streams this account can access.
	 *
	 * @since 1.31.0
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
	 * @since 1.31.0
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

		for ( const datastream of datastreams ) {
			if ( select( CORE_SITE ).isSiteURLMatch( datastream.defaultUri ) ) {
				return datastream;
			}
		}

		return null;
	} ),

	/**
	 * Gets web data streams in batch for selected properties.
	 *
	 * @since 1.32.0
	 *
	 * @param {Object}         state       Data store's state.
	 * @param {Array.<string>} propertyIDs GA4 property IDs.
	 * @return {Object} Web data streams.
	 */
	getWebDataStreamsBatch( state, propertyIDs ) {
		return pick( state.webdatastreams, propertyIDs );
	},
};

const store = Data.combineStores(
	fetchGetWebDataStreamsStore,
	fetchGetWebDataStreamsBatchStore,
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
