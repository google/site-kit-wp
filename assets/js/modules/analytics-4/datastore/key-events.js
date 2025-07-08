/**
 * `modules/analytics-4` data store: key events.
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
import {
	commonActions,
	combineStores,
	createReducer,
} from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetKeyEventsStore = createFetchStore( {
	baseName: 'getKeyEvents',
	controlCallback: () => {
		return get( 'modules', MODULE_SLUG_ANALYTICS_4, 'key-events', {} );
	},
	reducerCallback: createReducer( ( state, keyEvents ) => {
		state.keyEvents = keyEvents;
	} ),
} );

const baseInitialState = {
	keyEvents: undefined,
};

const baseResolvers = {
	*getKeyEvents() {
		const registry = yield commonActions.getRegistry();
		const existingKeyEvents = registry
			.select( MODULES_ANALYTICS_4 )
			.getKeyEvents();

		// If there are already `keyEvents` loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingKeyEvents ) {
			return;
		}

		yield fetchGetKeyEventsStore.actions.fetchGetKeyEvents();
	},
};

const baseSelectors = {
	/**
	 * Gets GA4 key events.
	 *
	 * @since 1.96.0
	 * @since 1.99.0 Removed the `propertyID` parameter.
	 * @since 1.155.0 Renamed from `getConversionEvents` to `getKeyEvents`.
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} GA4 key events; `undefined` if not loaded.
	 */
	getKeyEvents( state ) {
		return state.keyEvents;
	},
};

const store = combineStores( fetchGetKeyEventsStore, {
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
