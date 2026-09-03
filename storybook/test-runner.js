/**
 * Storybook test-runner config.
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
const { setupPage } = require( '@storybook/test-runner' );

// Substring of the error Playwright throws from `page.exposeBinding()` when
// a binding name is already registered on the page. Keep this in sync with
// https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/page.ts.
const ALREADY_REGISTERED_MESSAGE = 'has been already registered';

/**
 * Makes `page.exposeBinding()` a no-op for bindings that are already
 * registered, instead of throwing.
 *
 * Playwright bindings (unlike `<script>` tags added via
 * `page.addScriptTag()`) survive page navigations, so they're still
 * registered on `page` by the time `restoreTestHelperIfNeeded()` below calls
 * the test-runner's `setupPage()` a second time for the same page. Without
 * this, that second call throws before it reaches the part that re-injects
 * the missing `__test` helper.
 *
 * @since n.e.x.t
 *
 * @param {Object} page Playwright page to patch.
 */
function tolerateReExposedBindings( page ) {
	if ( page.__exposeBindingTolerant ) {
		return;
	}

	page.__exposeBindingTolerant = true;

	const originalExposeBinding = page.exposeBinding.bind( page );
	page.exposeBinding = async ( name, ...args ) => {
		try {
			return await originalExposeBinding( name, ...args );
		} catch ( error ) {
			if ( error.message?.includes( ALREADY_REGISTERED_MESSAGE ) ) {
				return undefined;
			}

			throw error;
		}
	};
}

module.exports = {
	/**
	 * Restores the test-runner's page setup if a story-driven reload wiped it.
	 *
	 * `storybook/preview.js`'s `reloadForFeatures` decorator calls
	 * `window.location.reload()` whenever a story needs a different set of
	 * feature flags than the ones already baked into the current page load
	 * (see `storybook/utils/reloadForFeatures.js`). The test-runner only runs
	 * its own page setup (which navigates to the Storybook iframe and injects
	 * the `__test` helper via `page.addScriptTag()`) once per test file, so
	 * that reload wipes the injected helper for the rest of the file. Any
	 * subsequent story visited on this page then fails with
	 * `ReferenceError: __test is not defined` instead of rendering.
	 *
	 * Re-run the test-runner's own `setupPage()` (which re-navigates and
	 * re-injects the helper) whenever it's missing, immediately before each
	 * story is visited, so later stories in the same file keep working
	 * however many times an earlier story reloaded the page.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} page Playwright page for the current test file.
	 */
	async preVisit( page ) {
		const hasTestHelper = await page
			.evaluate( () => typeof window.__test === 'function' )
			.catch( () => false );

		if ( ! hasTestHelper ) {
			tolerateReExposedBindings( page );
			await setupPage( page, page.context() );
		}
	},
};
