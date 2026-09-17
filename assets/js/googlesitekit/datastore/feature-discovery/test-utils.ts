/**
 * `core/feature-discovery` datastore test utilities.
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
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from './constants';
import type { Feature } from './types';

/**
 * Provides feature catalog entries to the given registry.
 *
 * Each entry is registered over a complete default feature so callers only
 * need to provide the fields relevant to their test or story.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Object}   registry Data registry object.
 * @param {Object[]} features Feature entries to register.
 * @return {void}
 */
export function provideFeatures(
	registry: WPDataRegistry,
	features: Partial< Feature >[] = []
) {
	const defaultFeature: Feature = {
		slug: 'test-feature',
		title: 'Test feature',
		shortDescription: 'Test feature description.',
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		addedInVersion: '1.186.0',
		prerequisiteModules: [],
		badges: [],
		setup: {
			type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
		},
	};

	features.forEach( ( feature ) => {
		const { slug, ...settings } = { ...defaultFeature, ...feature };

		registry
			.dispatch( CORE_FEATURE_DISCOVERY )
			.registerFeature( slug, settings );
	} );
}
