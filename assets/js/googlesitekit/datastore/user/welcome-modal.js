/**
 * `core/user` data store: welcome modal
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { createRegistrySelector } from 'googlesitekit-data';
import {
	CORE_USER,
	WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
	WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
} from './constants';

const selectors = {
	/**
	 * Returns whether the data gathering complete modal is active.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Is the data gathering complete modal active or not.
	 */
	isDataGatheringCompleteModalActive: createRegistrySelector(
		( select ) => () =>
			select( CORE_USER ).isItemDismissed(
				WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG
			) &&
			! select( CORE_USER ).isItemDismissed(
				WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG
			)
	),
};

const store = {
	selectors,
};

export default store;
