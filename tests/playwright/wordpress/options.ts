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

type TestUserProfile = {
	email?: string;
	firstName?: string;
	lastName?: string;
	dismissedItems?: string[];
};

/**
 * A connected module for a test: either a bare slug, or a slug paired with the
 * module settings to apply (e.g. an AdSense account ID).
 *
 * @since n.e.x.t
 */
export type ConnectedModule =
	| string
	| { slug: string; settings?: Record< string, unknown > };

/**
 * Dashboard-sharing settings for one module.
 *
 * @since n.e.x.t
 */
export type SharedModuleSettings = {
	sharedRoles: string[];
	management: 'all_admins' | 'owner';
};

/**
 * Sets the plugins to activate for the test.
 *
 * Plugin file paths without a `/` are loaded from the
 * `google-site-kit-test-plugins/` directory.
 *
 * @since 1.175.0
 * @since n.e.x.t Support plugins outside the test plugins directory.
 *
 * @param {string[]} plugins Plugin file paths relative to the plugins directory (e.g. `my-plugin/my-plugin.php`).
 * @return {TestDetailsAnnotation} The annotation to use for the test.
 */
export function withPlugins( ...plugins: string[] ): TestDetailsAnnotation {
	return {
		type: '_wp:plugin',
		description: plugins
			.map( ( plugin ) =>
				plugin.includes( '/' )
					? plugin
					: `google-site-kit-test-plugins/${ plugin }`
			)
			.join( ANNOTATION_SEPARATOR ),
	};
}

/**
 * Sets the feature flags to enable for the test.
 *
 * @since 1.177.0
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
 * Sets the connected modules for the test.
 *
 * Each module is either a bare slug or a `{ slug, settings }` object; a bare
 * slug is normalised to `{ slug }`. A module with settings is both connected and
 * configured with those settings on the WordPress side.
 *
 * @since 1.177.0
 * @since n.e.x.t Accepts per-module settings via `{ slug, settings }` entries.
 *
 * @param {...ConnectedModule} modules Connected modules (slug or `{ slug, settings }`).
 * @return {TestDetailsAnnotation} The annotation to use for the test.
 */
export function withConnectedModules(
	...modules: ConnectedModule[]
): TestDetailsAnnotation {
	const normalized = modules.map( ( module ) =>
		typeof module === 'string' ? { slug: module } : module
	);

	return {
		type: '_wp:connected-modules',
		description: JSON.stringify( normalized ),
	};
}

/**
 * Sets the dashboard-sharing settings for the test.
 *
 * Forces the sharing settings on read so a module is shared without the
 * save-time sanitize dropping it, letting a view-only test list a shared
 * module's sections.
 *
 * @since n.e.x.t
 *
 * @param {Record<string, SharedModuleSettings>} sharing Sharing settings keyed by module slug.
 * @return {TestDetailsAnnotation} The annotation to use for the test.
 */
export function withSharedModules(
	sharing: Record< string, SharedModuleSettings >
): TestDetailsAnnotation {
	return {
		type: '_wp:shared-modules',
		description: JSON.stringify( sharing ),
	};
}

/**
 * Sets the fixtures to use for the test.
 *
 * @since 1.177.0
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
 * @param {string}           user    The user to use for the test.
 * @param {TestUserProfile=} profile Optional profile overrides for the user.
 * @return {TestDetailsAnnotation}   The annotation to use for the test.
 */

export function asUser(
	user: string,
	profile?: TestUserProfile
): TestDetailsAnnotation {
	const description = profile
		? JSON.stringify( {
				login: user,
				...profile,
		  } )
		: user;

	return {
		type: '_wp:as-user',
		description,
	};
}

/**
 * Enables Conversion Tracking for the test.
 *
 * @since n.e.x.t
 *
 * @return {TestDetailsAnnotation} The annotation to use for the test.
 */
export function withConversionTracking(): TestDetailsAnnotation {
	return {
		type: '_wp:conversion-tracking',
		description: 'enabled',
	};
}
