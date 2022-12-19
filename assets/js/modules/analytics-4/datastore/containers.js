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
	reducerCallback( state, container ) {
		return { ...state, container };
	},
	argsToParams( measurementID ) {
		return { measurementID };
	},
	validateParams( { measurementID } = {} ) {
		invariant( measurementID, 'measurementID is required.' );
	},
} );

const baseInitialState = {
	container: undefined,
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
};

const baseSelectors = {};

const store = Data.combineStores( fetchGetGoogleTagContainerStore, {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
