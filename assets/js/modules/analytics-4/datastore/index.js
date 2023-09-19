/**
 * `modules/analytics-4` data store
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
import { MODULES_ANALYTICS_4 } from './constants';
import accounts from './accounts';
import baseModuleStore from './base';
import containers from './containers';
import conversionEvents from './conversion-events';
import enhancedMeasurement from './enhanced-measurement';
import properties from './properties';
import report from './report';
import service from './service';
import tags from './tags';
import webdatastreams from './webdatastreams';
import { createSnapshotStore } from '../../../googlesitekit/data/create-snapshot-store';

const store = Data.combineStores(
	accounts,
	baseModuleStore,
	containers,
	conversionEvents,
	createSnapshotStore( MODULES_ANALYTICS_4 ),
	enhancedMeasurement,
	properties,
	report,
	service,
	tags,
	webdatastreams
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export const registerStore = ( registry ) => {
	registry.registerStore( MODULES_ANALYTICS_4, store );
};

export default store;
