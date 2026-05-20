/**
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
 * External dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { combineStores, commonStore } from 'googlesitekit-data';
import { createSelectionPanelStore } from '@/js/googlesitekit/data/create-selection-panel-store';
import pdf from './pdf';
import { CORE_PDF } from './constants';

const sectionsPanel = createSelectionPanelStore( {
	slug: 'sections',
	initialSelectedItems: [],
} );

interface Store {
	initialState: typeof pdf.initialState & typeof sectionsPanel.initialState;
	actions: typeof pdf.actions &
		typeof commonStore.actions &
		typeof sectionsPanel.actions;
	controls: typeof pdf.controls & typeof commonStore.controls;
	reducer: typeof pdf.reducer;
	resolvers: typeof pdf.resolvers;
	selectors: typeof pdf.selectors & typeof sectionsPanel.selectors;
}

const store = combineStores( commonStore, pdf, sectionsPanel ) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export function registerStore( registry: WPDataRegistry ) {
	registry.registerStore( CORE_PDF, store );
}

export default store;
