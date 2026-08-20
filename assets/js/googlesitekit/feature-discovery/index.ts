/**
 * Public Feature Discovery API entrypoint.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	actions,
	registerStore,
	selectors,
} from '@/js/googlesitekit/datastore/feature-discovery';
import type { FeatureSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';

export { actions, registerStore, selectors };

/**
 * Creates a new instance of Feature Discovery.
 *
 * @since n.e.x.t
 *
 * @param {Object}   registry          Datastore registry.
 * @param {Function} registry.dispatch Registry dispatch function.
 * @return {Object} Feature Discovery instance.
 */
export function createFeatureDiscovery( registry: WPDataRegistry ) {
	const { dispatch } = registry;

	const FeatureDiscovery = {
		/**
		 * Registers a feature in the catalog.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string}         slug                           Feature's slug.
		 * @param {Object}         settings                       Feature's settings.
		 * @param {string}         settings.title                 Feature's card title.
		 * @param {string}         settings.shortDescription      Feature's card description.
		 * @param {number}         settings.effort                Effort level: `1`, `2` or `3`.
		 * @param {Array.<string>} settings.goalCategories        Goal categories the feature belongs to, in order. The first is its primary category.
		 * @param {string}         settings.addedInVersion        Site Kit version the feature was released in.
		 * @param {Object}         settings.setup                 Setup descriptor driving the feature's CTA and activation.
		 * @param {Array.<string>} [settings.prerequisiteModules] Optional. Modules the feature depends on but does not itself set up. Default is: `[]`.
		 * @param {Function}       [settings.checkRequirements]   Optional. Hides the feature when it returns false. Default is visible.
		 * @param {Object}         [settings.detail]              Optional. Detail panel content.
		 * @param {Array.<string>} [settings.badges]              Optional. Static badges. Default is: `[]`.
		 * @param {Object}         [settings.successNotice]       Optional. Copy for the notice shown once the feature is set up.
		 * @return {Object} Feature registration action result.
		 */
		registerFeature: ( slug: string, settings: FeatureSettings ) => {
			return dispatch( 'core/feature-discovery' ).registerFeature(
				slug,
				settings
			);
		},
	};

	return FeatureDiscovery;
}
