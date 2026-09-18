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
 * Session storage key for the feature flags the page loaded with. The inline
 * script in `storybook/preview-head.html` reads the same key, so change both
 * together.
 */
const STORAGE_KEY = 'googlesitekit-storybook-features';

/**
 * Reloads the Storybook preview when a story needs different feature flags
 * than the page loaded with.
 *
 * A datastore's `base.js` calls `isFeatureEnabled()` while the bundle loads,
 * so changing `enabledFeatures` later has no effect. A reload runs the bundle
 * again, and `storybook/preview-head.html` sets the flags from the same
 * session storage key first.
 *
 * @since n.e.x.t
 *
 * @param {string[]} [features] Optional. Feature flags the story needs.
 * @return {boolean} `true` when the page is reloading, so `storybook/preview.js`
 *                   renders nothing.
 */
export function reloadForFeatures( features: string[] = [] ): boolean {
	let activeFeatures: string[] = [];

	try {
		const storedFeatures = window.sessionStorage.getItem( STORAGE_KEY );
		activeFeatures = storedFeatures ? JSON.parse( storedFeatures ) : [];
	} catch {
		// A missing or broken value means the page loaded with no flags.
	}

	// `xor()` returns the flags only one list has, so an empty result means the
	// page already has the flags the story needs.
	if ( xor( activeFeatures, features ).length === 0 ) {
		return false;
	}

	try {
		window.sessionStorage.setItem(
			STORAGE_KEY,
			JSON.stringify( features )
		);
	} catch {
		// Without the stored flags, the page reloads forever.
		return false;
	}

	window.location.reload();

	return true;
}
