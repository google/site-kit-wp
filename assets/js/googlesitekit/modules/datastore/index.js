/**
 * `core/modules` data store
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
 * Internal dependencies
 */
import { commonStore, combineStores } from 'googlesitekit-data';
import settingsPanel from './settings-panel';
import settings from './settings';
import modules from './modules';
import sharingSettings from './sharing-settings';
import { createErrorStore } from '../../data/create-error-store';
import { CORE_MODULES } from './constants';

const store = combineStores(
	commonStore,
	modules,
	createErrorStore( CORE_MODULES ),
	settingsPanel,
	settings,
	sharingSettings
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export const registerStore = ( registry ) => {
	registry.registerStore( CORE_MODULES, store );
};

export default store;
