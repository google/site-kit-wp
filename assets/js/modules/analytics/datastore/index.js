/**
 * modules/analytics data store
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Modules from 'googlesitekit-modules';
import accounts from './accounts';
import properties from './properties';
import profiles from './profiles';
import setup from './setup';
import tags from './tags';

export const STORE_NAME = 'modules/analytics';

const baseModuleStore = Modules.createModuleStore( 'analytics', {
	settingSlugs: [
		'anonymizeIP',
		'accountID',
		'profileID',
		'propertyID',
		'internalWebPropertyID',
		'useSnippet',
		'trackingDisabled',
	],
} );

export const INITIAL_STATE = Data.collectState(
	baseModuleStore.INITIAL_STATE,
	accounts.INITIAL_STATE,
	properties.INITIAL_STATE,
	profiles.INITIAL_STATE,
	setup.INITIAL_STATE,
	tags.INITIAL_STATE,
);

export const actions = Data.collectActions(
	baseModuleStore.actions,
	accounts.actions,
	properties.actions,
	profiles.actions,
	setup.actions,
	tags.actions,
);

export const controls = Data.collectControls(
	baseModuleStore.controls,
	accounts.controls,
	properties.controls,
	profiles.controls,
	setup.controls,
	tags.controls,
);

export const reducer = Data.addInitializeReducer(
	INITIAL_STATE,
	Data.collectReducers(
		baseModuleStore.reducer,
		accounts.reducer,
		properties.reducer,
		profiles.reducer,
		setup.reducer,
		tags.reducer,
	)
);

export const resolvers = Data.collectResolvers(
	baseModuleStore.resolvers,
	accounts.resolvers,
	properties.resolvers,
	profiles.resolvers,
	setup.resolvers,
	tags.resolvers,
);

export const selectors = Data.collectSelectors(
	baseModuleStore.selectors,
	accounts.selectors,
	properties.selectors,
	profiles.selectors,
	setup.selectors,
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
