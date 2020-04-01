/**
 * modules/adsense data store
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Modules from 'googlesitekit-modules';
import accounts from './accounts';
import alerts from './alerts';
import clients from './clients';
import tags from './tags';

const baseModuleStore = Modules.createModuleStore( 'adsense', {
	settingSlugs: [
		'accountID',
		'clientID',
		'useSnippet',
		'accountStatus',
		'siteStatus',
	],
} );

export const STORE_NAME = baseModuleStore.STORE_NAME;

export const INITIAL_STATE = Data.collectState(
	baseModuleStore.INITIAL_STATE,
	accounts.INITIAL_STATE,
	alerts.INITIAL_STATE,
	clients.INITIAL_STATE,
	tags.INITIAL_STATE,
);

export const actions = Data.addInitializeAction( Data.collectActions(
	baseModuleStore.actions,
	accounts.actions,
	alerts.actions,
	clients.actions,
	tags.actions,
) );

export const controls = Data.collectControls(
	baseModuleStore.controls,
	accounts.controls,
	alerts.controls,
	clients.controls,
	tags.controls,
);

export const reducer = Data.addInitializeReducer(
	INITIAL_STATE,
	Data.collectReducers(
		baseModuleStore.reducer,
		accounts.reducer,
		alerts.reducer,
		clients.reducer,
		tags.reducer,
	)
);

export const resolvers = Data.collectResolvers(
	baseModuleStore.resolvers,
	accounts.resolvers,
	alerts.resolvers,
	clients.resolvers,
	tags.resolvers,
);

export const selectors = Data.collectSelectors(
	baseModuleStore.selectors,
	accounts.selectors,
	alerts.selectors,
	clients.selectors,
	tags.selectors,
);

const store = {
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

// Register this store on the global registry.
Data.registerStore( STORE_NAME, store );

export default store;
