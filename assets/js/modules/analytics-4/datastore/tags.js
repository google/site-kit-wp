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
import { MODULES_ANALYTICS_4 } from './constants';
import { getTagMatchers } from '../utils/tag-matchers';
import { isValidMeasurementID } from '../utils/validation';

const existingTagStore = createExistingTagStore( {
	storeName: MODULES_ANALYTICS_4,
	tagMatchers: getTagMatchers(),
	isValidTag: isValidMeasurementID,
} );

// Override the `getExistingTag()` resolver to provide the extended Google Tag behavior.
existingTagStore.resolvers.getExistingTag = function* () {
	const registry = yield Data.commonActions.getRegistry();

	let existingTag = registry.select( MODULES_ANALYTICS_4 ).getExistingTag();

	if ( existingTag === undefined ) {
		existingTag = yield existingTagStore.actions.fetchGetExistingTag();
	}

	// As it's not possible to directly look up a Google Tag container by one of its tag IDs, we look up the container by destination ID (the measurement ID).
	// We then check if the tag ID is included in the container's tag IDs. If so, we have confirmed the existing tag is a Google Tag pointing to the given measurement ID.
	// Otherwise, we ignore the existing tag (set it to null).
	if ( existingTag !== null ) {
		const container = yield Data.commonActions.await(
			registry
				.__experimentalResolveSelect( MODULES_ANALYTICS_4 )
				.getGoogleTagContainer( existingTag )
		);

		if ( ! container?.tagIds.includes( existingTag ) ) {
			existingTag = null;
		}
	}

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetExistingTag( existingTag );
};

const store = Data.combineStores( existingTagStore );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
