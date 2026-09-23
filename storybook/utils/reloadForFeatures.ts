/**
 * Feature flag reload utility for Storybook.
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
 * External dependencies
 */
import { xor } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs, hasQueryArg } from '@wordpress/url';

/**
 * Reloads Storybook when a story needs different feature flags than the page
 * loaded with.
 *
 * A datastore's `base.js` calls `isFeatureEnabled()` at module-evaluation
 * time, so changing `enabledFeatures` later has no effect. A reload runs the
 * bundle again, and `storybook/preview-head.html` sets the flags from session
 * storage first.
 *
 * @since n.e.x.t
 *
 * @param {string[]} [features] Optional. The feature flags the story needs.
 * @return {boolean} `true` when Storybook is reloading, and `false` when the
 *                   page already has the flags or session storage can't store
 *                   them.
 */
export function reloadForFeatures( features: string[] = [] ): boolean {
	// `enabledFeatures` is the list the bundle read at module-evaluation time.
	const enabledFeatures = window._googlesitekitBaseData.enabledFeatures || [];

	// `xor()` returns the flags only one list has, so an empty result means the
	// page already has the flags the story needs.
	if ( xor( enabledFeatures, features ).length === 0 ) {
		return false;
	}

	try {
		// The inline script in `storybook/preview-head.html` reads the same
		// session storage entry, so a change to its name goes in that file too.
		window.sessionStorage.setItem(
			'googlesitekit-storybook-features',
			JSON.stringify( features )
		);
	} catch {
		// Reloading without the stored flags would load the old flags again and
		// reload forever, so skip the reload.
		return false;
	}

	// A story page opened outside the Storybook app can hold a `features` value
	// in its URL, and `storybook/preview-head.html` reads that value before
	// session storage. A plain reload would load the old flags forever, so
	// `reloadForFeatures()` writes the story's flags into the URL instead.
	if (
		window.parent === window &&
		hasQueryArg( window.location.href, 'features' )
	) {
		window.location.replace(
			addQueryArgs( window.location.href, {
				features: features.join( ',' ),
			} )
		);

		return true;
	}

	// `parent` is the Storybook app, whose own URL holds the selected story, so
	// that story shows again after the reload.
	window.parent.location.reload();

	return true;
}
