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
import { createRegistrySelector } from 'googlesitekit-data';
import { CORE_WIDGETS } from './constants';

export const selectors = {
	/**
	 * Checks if a widget context is active.
	 *
	 * Returns `true` if the widget context is active.
	 * Returns `false` if the widget context is NOT active.
	 *
	 * @since 1.47.0
	 * @since 1.77.0 Add options.modules parameter.
	 *
	 * @param {Object}         state             Data store's state.
	 * @param {string}         slug              Widget context's slug.
	 * @param {Object}         [options]         Optional. Options parameter.
	 * @param {Array.<string>} [options.modules] Optional. List of module slugs, when provided the widgets checked will be restricted to those associated with the specified modules.
	 * @return {boolean} `true`/`false` based on whether widget context is active.
	 */
	isWidgetContextActive: createRegistrySelector(
		( select ) =>
			( state, contextSlug, options = {} ) => {
				invariant(
					contextSlug,
					'contextSlug is required to check a widget context is active.'
				);

				const { modules } = options;

				return select( CORE_WIDGETS )
					.getWidgetAreas( contextSlug )
					.some( ( area ) =>
						select( CORE_WIDGETS ).isWidgetAreaActive( area.slug, {
							modules,
						} )
					);
			}
	),
};

export default {
	selectors,
};
