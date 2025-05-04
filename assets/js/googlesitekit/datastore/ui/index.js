/**
 * `core/ui` data store.
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
import { combineStores, commonStore } from 'googlesitekit-data';
import { createErrorStore } from '../../data/create-error-store';
import { createSnapshotStore } from '../../data/create-snapshot-store';
import ui from './ui';
import { CORE_UI } from './constants';

const store = combineStores(
	commonStore,
	ui,
	createSnapshotStore( CORE_UI ),
	createErrorStore( CORE_UI )
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export const registerStore = ( registry ) => {
	registry.registerStore( CORE_UI, store );
};

export default store;
