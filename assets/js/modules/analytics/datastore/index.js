/**
 * `modules/analytics` data store
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
import Data from 'googlesitekit-data';
import { createSnapshotStore } from '../../../googlesitekit/data/create-snapshot-store';
import baseModuleStore from './base';
import accounts from './accounts';
import adsense from './adsense';
import goals from './goals';
import properties from './properties';
import profiles from './profiles';
import report from './report';
import tags from './tags';
import service from './service';
import setupFlow from './setup-flow';

import { MODULES_ANALYTICS } from './constants';

const store = Data.combineStores(
	baseModuleStore,
	accounts,
	adsense,
	goals,
	properties,
	profiles,
	report,
	createSnapshotStore( MODULES_ANALYTICS ),
	tags,
	service,
	setupFlow
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export const registerStore = ( registry ) => {
	registry.registerStore( MODULES_ANALYTICS, store );
};

export default store;
