/**
 * Feature flag test helpers.
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
 * Resets Jest's module cache, enables the given feature flags, and returns a
 * fresh copy of the test utils module.
 *
 * Use this when code under test reads feature flags at module load time (for
 * example `isFeatureEnabled()` in a datastore's `base.js`). In those cases,
 * `setEnabledFeatures()` and the `features` render option are too late because
 * the module has already been evaluated.
 *
 * Keep this module separate from `tests/js/utils.ts` so it can reload that
 * module without statically importing module stores.
 *
 * @since n.e.x.t
 * @private
 *
 * @param features Feature flags to enable before reloading modules.
 * @return Fresh test utils exports.
 */
export function reloadTestUtilsWithFeatures( features: Iterable< string > ) {
	jest.resetModules();

	const { enabledFeatures } =
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require( '@/js/features' );
	enabledFeatures.clear();

	for ( const feature of Array.from( features ) ) {
		enabledFeatures.add( feature );
	}

	return require( '@tests/js/utils' );
}

/**
 * Creates a test registry with feature flags enabled before module stores load.
 *
 * @since n.e.x.t
 * @private
 *
 * @param features Feature flags to enable before creating the registry.
 * @return Registry with all available stores registered.
 */
export function createTestRegistryWithFeatures(
	features: Iterable< string >
): WPDataRegistry {
	const { createTestRegistry } = reloadTestUtilsWithFeatures( features );

	return createTestRegistry();
}
