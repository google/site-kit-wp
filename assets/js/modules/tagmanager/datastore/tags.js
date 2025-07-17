/**
 * `modules/tagmanager` data store: existing tag.
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
import { MODULES_TAGMANAGER } from './constants';
import { isValidContainerID } from '../util/validation';
import { createExistingTagStore } from '../../../googlesitekit/data/create-existing-tag-store';
import tagMatchers from '../util/tag-matchers';

const store = createExistingTagStore( {
	moduleSlug: 'tagmanager',
	storeName: MODULES_TAGMANAGER,
	tagMatchers,
	isValidTag: isValidContainerID,
} );

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
