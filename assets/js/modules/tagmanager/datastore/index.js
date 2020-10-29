/**
 * `modules/tagmanager` data store
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
import { createSnapshotStore } from '../../../googlesitekit/data/create-snapshot-store';
import { STORE_NAME } from './constants';
import baseModuleStore from './base';
import accounts from './accounts';
import containers from './containers';
import tags from './tags';
import settings from './settings';
import versions from './versions';
import service from './service';

const store = Data.combineStores(
	baseModuleStore,
	accounts,
	containers,
	tags,
	settings,
	versions,
	createSnapshotStore( STORE_NAME ),
	service
);

// Register this store on the global registry.
Data.registerStore( STORE_NAME, store );

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
