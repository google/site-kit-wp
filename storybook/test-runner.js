/**
 * Storybook test runner configuration.
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

/**
 * Part of the error `page.exposeBinding()` throws for a binding name the page
 * already has.
 *
 * See: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/page.ts.
 */
const ALREADY_REGISTERED_MESSAGE = 'has been already registered';

/**
 * Makes `page.exposeBinding()` ignore a binding the page already has.
 *
 * A binding survives a page reload, so the second `setupPage()` call throws
 * before it adds the `__test` helper again.
 *
 * @since n.e.x.t
 *
 * @param {Object} page Playwright page to patch.
 */
function ignoreRegisteredBindings( page ) {
	if ( page.__ignoresRegisteredBindings ) {
		return;
	}

	page.__ignoresRegisteredBindings = true;

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
	 * Adds the `__test` helper again after a page reload removes it.
	 *
	 * The test runner adds the helper once per test file. A reload for a story
	 * with different feature flags removes it, and every later story then
	 * fails with `ReferenceError: __test is not defined`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} page Playwright page for the current test file.
	 */
	async preVisit( page ) {
		// `evaluate()` rejects while the page is still reloading.
		const hasTestHelper = await page
			.evaluate( () => typeof window.__test === 'function' )
			.catch( () => false );

		if ( ! hasTestHelper ) {
			ignoreRegisteredBindings( page );
			await setupPage( page, page.context() );
		}
	},
};
