/**
 * `modules/analytics-4` data store: coversion events.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { createReducer } from '../../../googlesitekit/data/create-reducer';

const fetchGetConversionEventsStore = createFetchStore( {
	baseName: 'getConversionEvents',
	controlCallback: ( { propertyID } ) => {
		return API.get( 'modules', 'analytics-4', 'conversion-events', {
			propertyID,
		} );
	},
	reducerCallback: createReducer(
		( state, conversionEvents, { propertyID } ) => {
			state.conversionEvents[ propertyID ] = conversionEvents;
		}
	),
	argsToParams( propertyID ) {
		return { propertyID };
	},
	validateParams( { propertyID } = {} ) {
		invariant( propertyID, 'propertyID is required.' );
	},
} );

const baseInitialState = {
	conversionEvents: {},
};

const baseResolvers = {
	*getConversionEvents( propertyID ) {
		if ( propertyID === undefined ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		const existingConversionEvents = registry
			.select( MODULES_ANALYTICS_4 )
			.getConversionEvents( propertyID );

		// If there are already `conversionEvents` loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingConversionEvents ) {
			return;
		}

		yield fetchGetConversionEventsStore.actions.fetchGetConversionEvents(
			propertyID
		);
	},
};

const baseSelectors = {
	/**
	 * Gets GA4 conversion events.
	 *
	 * @since 1.96.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID GA4 property ID.
	 * @return {(Array.<Object>|undefined)} GA4 conversion events; `undefined` if not loaded.
	 */
	getConversionEvents( state, propertyID ) {
		if ( propertyID === undefined ) {
			return undefined;
		}

		return state.conversionEvents[ propertyID ];
	},
};

const store = Data.combineStores( fetchGetConversionEventsStore, {
	initialState: baseInitialState,
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
