/**
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
 * External dependencies
 */
import { TestDetailsAnnotation } from '@playwright/test';

/**
 * Separator for annotation values.
 *
 * @since 1.175.0
 */
export const ANNOTATION_SEPARATOR = ',';

/**
 * Sets the plugins to activate for the test.
 *
 * @since 1.175.0
 *
 * @param {string[]} plugins Plugin file paths relative to the plugins directory (e.g. `my-plugin/my-plugin.php`).
 * @return {TestDetailsAnnotation} The annotation to use for the test.
 */
export function withPlugins( ...plugins: string[] ): TestDetailsAnnotation {
	return {
		type: '_wp:plugin',
		description: plugins
			.map( ( plugin ) => `google-site-kit-test-plugins/${ plugin }` )
			.join( ANNOTATION_SEPARATOR ),
	};
}

/**
 * Sets the feature flags to enable for the test.
 *
 * @since n.e.x.t
 *
 * @param {string[]} flags Feature flag names to enable.
 * @return {TestDetailsAnnotation} The annotation to use for the test.
 */
export function withFeatureFlags( ...flags: string[] ): TestDetailsAnnotation {
	return {
		type: '_wp:feature-flags',
		description: flags.join( ANNOTATION_SEPARATOR ),
	};
}

/**
 * Sets the fixtures to use for the test.
 *
 * @since n.e.x.t
 *
 * @param {string} fixtures The fixtures to use for the test.
 * @return {TestDetailsAnnotation} The annotation to use for the test.
 */
export function withFixtures( fixtures: string ): TestDetailsAnnotation {
	return {
		type: '_wp:fixtures',
		description: fixtures,
	};
}

/**
 * Sets the user to use for the test.
 *
 * @since 1.175.0
 *
 * @param {string} user The user to use for the test.
 * @return {TestDetailsAnnotation} The annotation to use for the test.
 */
export function asUser( user: string ): TestDetailsAnnotation {
	return {
		type: '_wp:as-user',
		description: user,
	};
}
