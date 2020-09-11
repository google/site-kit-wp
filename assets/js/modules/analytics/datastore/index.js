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
import { createSnapshotStore } from '../../../googlesitekit/data/create-snapshot-store';
import accounts from './accounts';
import adsense from './adsense';
import properties from './properties';
import profiles from './profiles';
import report from './report';
import settings from './settings';
import tags from './tags';
import service from './service';
import { STORE_NAME } from './constants';

export { STORE_NAME };

const baseModuleStore = Modules.createModuleStore( 'analytics', {
	storeName: STORE_NAME,
	settingSlugs: [
		'anonymizeIP',
		'accountID',
		'profileID',
		'propertyID',
		'internalWebPropertyID',
		'useSnippet',
		'trackingDisabled',
		'ownerID',
	],
	adminPage: 'googlesitekit-module-analytics',
} );

const store = Data.combineStores(
	baseModuleStore,
	accounts,
	adsense,
	properties,
	profiles,
	report,
	settings,
	createSnapshotStore( STORE_NAME ),
	tags,
	service
);

export const INITIAL_STATE = store.INITIAL_STATE;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

// Register this store on the global registry.
Data.registerStore( STORE_NAME, store );

export default store;
