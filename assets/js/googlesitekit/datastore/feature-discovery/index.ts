/**
 * `core/feature-discovery` data store
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { combineStores, commonStore } from 'googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from './constants';
import featuresStore from './features';
import newnessStore from './newness';
import selectorsStore from './selectors';

interface Store {
	initialState: typeof featuresStore.initialState;
	actions: typeof featuresStore.actions &
		typeof newnessStore.actions &
		typeof commonStore.actions;
	controls: typeof commonStore.controls;
	reducer: typeof featuresStore.reducer;
	resolvers: Record< string, never >;
	selectors: typeof selectorsStore.selectors;
}

const store = combineStores(
	commonStore,
	featuresStore,
	newnessStore,
	selectorsStore
) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export function registerStore( registry: WPDataRegistry ) {
	registry.registerStore( CORE_FEATURE_DISCOVERY, store );
}

export default store;
