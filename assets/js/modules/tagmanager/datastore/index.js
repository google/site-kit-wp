/**
 * `modules/tagmanager` data store
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
import { combineStores } from 'googlesitekit-data';
import { createSnapshotStore } from '../../../googlesitekit/data/create-snapshot-store';
import { MODULES_TAGMANAGER } from './constants';
import baseModuleStore from './base';
import accounts from './accounts';
import containers from './containers';
import tags from './tags';
import versions from './versions';
import service from './service';
import { areSettingsEditDependenciesLoaded } from './settings';

const store = combineStores(
	baseModuleStore,
	accounts,
	containers,
	tags,
	versions,
	createSnapshotStore( MODULES_TAGMANAGER ),
	{ selectors: { areSettingsEditDependenciesLoaded } },
	service
);

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export const registerStore = ( registry ) => {
	registry.registerStore( MODULES_TAGMANAGER, store );
};

export default store;
