/**
 * `core/widgets` data store: contexts.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_WIDGETS } from './constants';

const { createRegistrySelector } = Data;

export const selectors = {
	/**
	 * Checks if a widget context is active.
	 *
	 * Returns `true` if the widget context is active.
	 * Returns `false` if the widget context is NOT active.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Widget context's slug.
	 * @return {boolean} `true`/`false` based on whether widget context is active.
	 */
	isWidgetContextActive: createRegistrySelector(
		( select ) => ( state, contextSlug ) => {
			invariant(
				contextSlug,
				'contextSlug is required to check a widget context is active.'
			);

			return select( CORE_WIDGETS )
				.getWidgetAreas( contextSlug )
				.some( ( area ) =>
					select( CORE_WIDGETS ).isWidgetAreaActive( area.slug )
				);
		}
	),
};

export default {
	selectors,
};
