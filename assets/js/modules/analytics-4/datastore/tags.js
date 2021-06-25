/**
 * `modules/analytics-4` data store: tags.
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
import { createExistingTagStore } from '../../../googlesitekit/data/create-existing-tag-store';
import { STORE_NAME } from './constants';
import { getTagMatchers } from '../utils/tag-matchers';
import { isValidMeasurementID } from '../utils/validation';

const existingTagStore = createExistingTagStore( {
	storeName: STORE_NAME,
	tagMatchers: getTagMatchers(),
	isValidTag: isValidMeasurementID,
} );

const store = Data.combineStores(
	existingTagStore,
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
