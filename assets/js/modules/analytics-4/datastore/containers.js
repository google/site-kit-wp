/**
 * `modules/analytics-4` data store: containers.
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
import { MODULES_ANALYTICS_4 } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetGoogleTagContainerStore = createFetchStore( {
	baseName: 'getGoogleTagContainer',
	controlCallback( { measurementID } ) {
		return API.get(
			'modules',
			'analytics-4',
			'container-lookup',
			{ measurementID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback( state, container, { measurementID } ) {
		return {
			...state,
			containers: {
				...state.containers,
				[ measurementID ]: container,
			},
		};
	},
	argsToParams( measurementID ) {
		return { measurementID };
	},
	validateParams( { measurementID } = {} ) {
		invariant( measurementID, 'measurementID is required.' );
	},
} );

const fetchGetGoogleTagContainerDestinationsStore = createFetchStore( {
	baseName: 'getGoogleTagContainerDestinations',
	controlCallback( { gtmAccountID, gtmContainerID } ) {
		return API.get(
			'modules',
			'analytics-4',
			'container-lookup',
			{ gtmAccountID, gtmContainerID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback(
		state,
		containerDestinations,
		{ gtmAccountID, gtmContainerID }
	) {
		return {
			...state,
			containerDestinations: {
				...state.containerDestinations,
				[ gtmAccountID ]: {
					...containerDestinations[ gtmAccountID ],
				},
				[ gtmContainerID ]: {
					...containerDestinations[ gtmContainerID ],
				},
			},
		};
	},
	argsToParams( gtmAccountID, gtmContainerID ) {
		return { gtmAccountID, gtmContainerID };
	},
	validateParams( { gtmAccountID, gtmContainerID } = {} ) {
		invariant( gtmAccountID, 'gtmAccountID is required.' );
		invariant( gtmContainerID, 'gtmContainerID is required.' );
	},
} );

const baseInitialState = {
	containers: {},
	containerDestinations: {},
};

const baseActions = {};

const baseControls = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getGoogleTagContainer( measurementID ) {
		const registry = yield Data.commonActions.getRegistry();
		const container = registry
			.select( MODULES_ANALYTICS_4 )
			.getGoogleTagContainer( measurementID );

		if ( container === undefined ) {
			yield fetchGetGoogleTagContainerStore.actions.fetchGetGoogleTagContainer(
				measurementID
			);
		}
	},

	*getGoogleTagContainerDestinations( gtmAccountID, gtmContainerID ) {
		const registry = yield Data.commonActions.getRegistry();
		const containerDestinations = registry
			.select( MODULES_ANALYTICS_4 )
			.getGoogleTagContainerDestinations( gtmAccountID, gtmContainerID );

		if ( containerDestinations === undefined ) {
			yield fetchGetGoogleTagContainerDestinationsStore.actions.fetchGetGoogleTagContainerDestinations(
				gtmAccountID,
				gtmContainerID
			);
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the Google Tag container for the given measurement ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state         Data store's state.
	 * @param {string} measurementID Measurement ID.
	 * @return {Object|undefined} Google Tag container object, or undefined if not loaded.
	 */
	getGoogleTagContainer( state, measurementID ) {
		return state.containers[ measurementID ];
	},
};

const store = Data.combineStores(
	fetchGetGoogleTagContainerStore,
	fetchGetGoogleTagContainerDestinationsStore,
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
