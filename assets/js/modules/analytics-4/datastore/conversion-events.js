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
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import { commonActions, combineStores } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { produce } from 'immer';

const fetchGetConversionEventsStore = createFetchStore( {
	baseName: 'getConversionEvents',
	controlCallback: () => {
		return get( 'modules', 'analytics-4', 'conversion-events', {} );
	},
	reducerCallback: ( state, conversionEvents ) => {
		return produce( state, ( draft ) => {
			draft.conversionEvents = conversionEvents;
		} );
	},
} );

const baseInitialState = {
	conversionEvents: undefined,
};

const baseResolvers = {
	*getConversionEvents() {
		const registry = yield commonActions.getRegistry();
		const existingConversionEvents = registry
			.select( MODULES_ANALYTICS_4 )
			.getConversionEvents();

		// If there are already `conversionEvents` loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingConversionEvents ) {
			return;
		}

		yield fetchGetConversionEventsStore.actions.fetchGetConversionEvents();
	},
};

const baseSelectors = {
	/**
	 * Gets GA4 conversion events.
	 *
	 * @since 1.96.0
	 * @since 1.99.0 Removed the `propertyID` parameter.
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} GA4 conversion events; `undefined` if not loaded.
	 */
	getConversionEvents( state ) {
		return state.conversionEvents;
	},
};

const store = combineStores( fetchGetConversionEventsStore, {
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
