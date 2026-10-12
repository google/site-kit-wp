/**
 * Visual regression test interactions.
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
const { upperFirst } = require( 'lodash' );

/**
 * Internal dependencies
 */
const { waitForSettled } = require( './readiness' );

const FONT_SIZE_TIMEOUT = 5000;

/**
 * Hovers over and clicks the elements a scenario names.
 *
 * Interactive scenarios run in their own browser context (see `fixtures.js`),
 * so the mouse position never carries over to another story.
 *
 * @since n.e.x.t
 *
 * @param {Object} page     The Playwright page.
 * @param {Object} scenario The scenario.
 * @param {Object} network  The page's network tracker, from `fixtures.js`.
 */
async function runInteractions( page, scenario, network ) {
	if ( ! scenario.hasInteractions ) {
		return;
	}

	if ( scenario.hoverSelector ) {
		await page.locator( scenario.hoverSelector ).first().hover();
	}

	if ( scenario.clickSelector ) {
		await page.locator( scenario.clickSelector ).first().click();
	}

	if ( scenario.postInteractionWait ) {
		await page.waitForTimeout( scenario.postInteractionWait );
	}

	await waitForSettled( page, network );
}

/**
 * Re-runs `DataBlockGroup`'s font fitting, then waits for the expected sizes.
 *
 * `DataBlockGroup` shrinks its data points to fit on resize, so the scenario
 * clears their sizes and nudges the viewport to make it fit them again.
 *
 * @since n.e.x.t
 *
 * @param {Object} page          The Playwright page.
 * @param {Object} scenario      The scenario.
 * @param {Object} network       The page's network tracker, from `fixtures.js`.
 * @param {string} viewportLabel The viewport, from `viewports.js`.
 */
async function runStoryHooks( page, scenario, network, viewportLabel ) {
	if ( scenario.resetDataBlockGroup ) {
		await page.evaluate( () => {
			document
				.querySelectorAll( '.googlesitekit-data-block__datapoint' )
				.forEach( ( dataPoint ) => {
					dataPoint.style.fontSize = '';
				} );
		} );

		const viewport = page.viewportSize();

		await page.setViewportSize( {
			width: viewport.width + 1,
			height: viewport.height + 1,
		} );
		await waitForSettled( page, network );
		await page.setViewportSize( viewport );
		await waitForSettled( page, network );
	}

	// For example, `fontSizeLarge: 41`, or `false` for no fixed size.
	const expectedFontSize =
		scenario[ `fontSize${ upperFirst( viewportLabel ) }` ];

	if (
		scenario.waitForFontSizeToMatch &&
		typeof expectedFontSize === 'number'
	) {
		try {
			await page.waitForFunction(
				( { selector, fontSize } ) => {
					const elements = document.querySelectorAll( selector );

					return (
						elements.length > 0 &&
						[ ...elements ].every(
							( element ) =>
								parseInt( element.style.fontSize, 10 ) ===
								fontSize
						)
					);
				},
				{
					selector: scenario.waitForFontSizeToMatch,
					fontSize: expectedFontSize,
				},
				{ timeout: FONT_SIZE_TIMEOUT, polling: 100 }
			);
		} catch ( error ) {
			const actual = await page.evaluate(
				( selector ) =>
					[ ...document.querySelectorAll( selector ) ].map(
						( element ) => element.style.fontSize || '(none)'
					),
				scenario.waitForFontSizeToMatch
			);

			throw new Error(
				`Expected "${ scenario.waitForFontSizeToMatch }" to reach font size ` +
					`${ expectedFontSize }px, but found: ${ actual.join(
						', '
					) }.`
			);
		}
	}
}

module.exports = {
	runInteractions,
	runStoryHooks,
};
