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
const { getStoryContext, setupPage } = require( '@storybook/test-runner' );
const { xor } = require( 'lodash' );

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
 * @param {Object} page The Playwright page to patch.
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
	 * Loads the page with the story's feature flags before the story renders.
	 *
	 * If the page loads without the story's feature flags, the decorator in
	 * `storybook/preview.js` that calls `reloadForFeatures()` reloads the page
	 * during the test. The test then passes, but the story never rendered.
	 *
	 * A page load removes the `__test` helper, so `preVisit()` adds it again.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} page    The Playwright page for the current test file.
	 * @param {Object} context The test runner context for the story.
	 */
	async preVisit( page, context ) {
		// Wait for the preview to load its story store, which
		// `getStoryContext()` reads.
		await page.evaluate( () => window.__STORYBOOK_PREVIEW__.ready() );

		const { parameters } = await getStoryContext( page, context );
		const features = parameters.features || [];
		const enabledFeatures = await page.evaluate(
			() => window._googlesitekitBaseData.enabledFeatures
		);

		if ( xor( features, enabledFeatures ).length > 0 ) {
			// `storybook/preview-head.html` reads the `features` query
			// parameter into session storage. `setupPage()` below loads
			// `iframe.html` again with no query string, and
			// `storybook/preview-head.html` then reads the flags back from
			// session storage.
			await page.goto(
				new URL(
					`iframe.html?features=${ features.join( ',' ) }`,
					page.url()
				).href
			);
		}

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
