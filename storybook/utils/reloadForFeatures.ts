/**
 * Utility to reload the Storybook preview iframe when a story needs a
 * different set of feature flags than the ones already active on the page.
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

// Keep in sync with the inline script in `storybook/preview-head.html`,
// which reads this same key to seed `_googlesitekitBaseData.enabledFeatures`
// before the bundle (re-)evaluates.
const STORAGE_KEY = 'googlesitekit-storybook-features';

/**
 * Gets the feature flags currently baked into this page load.
 *
 * @since n.e.x.t
 *
 * @return {string[]} Feature flags read from session storage.
 */
function getActiveFeatures(): string[] {
	try {
		const raw = window.sessionStorage.getItem( STORAGE_KEY );
		return raw ? JSON.parse( raw ) : [];
	} catch {
		return [];
	}
}

/**
 * Checks whether two feature flag lists contain the same set of flags,
 * ignoring order.
 *
 * @since n.e.x.t
 *
 * @param {string[]} a First list of feature flags.
 * @param {string[]} b Second list of feature flags.
 * @return {boolean} True if both lists contain the same flags.
 */
function featureSetsMatch( a: string[], b: string[] ): boolean {
	if ( a.length !== b.length ) {
		return false;
	}

	const sortedA = [ ...a ].sort();
	const sortedB = [ ...b ].sort();

	return sortedA.every( ( feature, index ) => feature === sortedB[ index ] );
}

/**
 * Reloads the Storybook preview iframe if the given story requires a
 * different set of feature flags than the ones already baked into this page
 * load, so that flags checked at module-evaluation time (eg. via
 * `isFeatureEnabled()` at the top of a datastore's `base.js`, which only
 * ever runs once per page load) are correct for the story about to render.
 *
 * This can't be done by mutating `enabledFeatures` at runtime, because code
 * that reads it at module scope has already run by the time any decorator
 * executes. Reloading re-evaluates the whole bundle from scratch, and the
 * inline script in `storybook/preview-head.html` seeds
 * `_googlesitekitBaseData.enabledFeatures` from the same session storage
 * key before that happens.
 *
 * @since n.e.x.t
 *
 * @param {string[]} features Feature flags the current story needs enabled.
 * @return {boolean} True if a reload was triggered. Callers should avoid
 *                    rendering the story (and its other decorators) in this
 *                    case, since the page is about to navigate away.
 */
export function reloadForFeatures( features: string[] = [] ): boolean {
	if ( featureSetsMatch( getActiveFeatures(), features ) ) {
		return false;
	}

	window.sessionStorage.setItem( STORAGE_KEY, JSON.stringify( features ) );
	window.location.reload();

	return true;
}
