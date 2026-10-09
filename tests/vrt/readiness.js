/**
 * Visual regression test readiness checks.
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

// When a reference image exists and matches, `toHaveScreenshot()` takes a single
// screenshot without waiting for the page to settle. These checks are what
// make that screenshot show the finished story.

const RENDER_TIMEOUT = 30000;
const NETWORK_QUIET_MS = 150;
const NETWORK_TIMEOUT = 15000;
// Longer than the 250ms polling interval in `JoyrideTooltip`.
const DOM_QUIET_MS = 300;
// Stories frozen in a loading state never go quiet for long; don't wait on
// them forever.
const DOM_QUIET_MAX_MS = 3000;
const CHART_TIMEOUT = 15000;

/**
 * Waits until the story has rendered, or fails with Storybook's error.
 *
 * `storybook/utils/vrt.js` records Storybook's render events on the document.
 *
 * @since n.e.x.t
 *
 * @param {Object} page The Playwright page.
 */
async function waitForStoryRender( page ) {
	await page.waitForFunction(
		() =>
			[ 'rendered', 'errored' ].includes(
				document.documentElement.dataset.vrtStoryState
			),
		null,
		{ timeout: RENDER_TIMEOUT }
	);

	const error = await page.evaluate( () =>
		document.documentElement.dataset.vrtStoryState === 'errored'
			? document.documentElement.dataset.vrtStoryError || 'Unknown error.'
			: null
	);

	if ( error ) {
		throw new Error( `The story failed to render: ${ error }` );
	}
}

/**
 * Waits until no element changes for a while.
 *
 * @since n.e.x.t
 *
 * @param {Object} page The Playwright page.
 */
async function waitForDOMQuiet( page ) {
	await page.evaluate(
		( { quietMs, maxMs } ) =>
			new Promise( ( resolve ) => {
				const timers = {};

				const observer = new MutationObserver( () => {
					clearTimeout( timers.quiet );
					timers.quiet = setTimeout( done, quietMs ); // eslint-disable-line no-use-before-define
				} );

				function done() {
					observer.disconnect();
					clearTimeout( timers.quiet );
					clearTimeout( timers.max );
					resolve();
				}

				observer.observe( document, {
					attributes: true,
					characterData: true,
					childList: true,
					subtree: true,
				} );

				timers.quiet = setTimeout( done, quietMs );
				timers.max = setTimeout( done, maxMs );
			} ),
		{ quietMs: DOM_QUIET_MS, maxMs: DOM_QUIET_MAX_MS }
	);
}

/**
 * Waits until every Google Chart that has data has finished drawing.
 *
 * Charts still loading their data render without an ID (an intentional loading
 * state), so only charts with data are waited for.
 *
 * @since n.e.x.t
 *
 * @param {Object} page The Playwright page.
 */
async function waitForCharts( page ) {
	try {
		await page.waitForFunction(
			() =>
				[
					...document.querySelectorAll(
						'[id^="googlesitekit-chart-"]'
					),
				].every( ( chart ) =>
					chart.querySelector( '.googlesitekit-chart__inner svg' )
				),
			null,
			{ timeout: CHART_TIMEOUT, polling: 50 }
		);
	} catch ( error ) {
		throw new Error(
			`A Google Chart didn't finish drawing within ${ CHART_TIMEOUT }ms.`
		);
	}
}

/**
 * Waits for two animation frames, so the last changes have been painted.
 *
 * @since n.e.x.t
 *
 * @param {Object} page The Playwright page.
 */
async function waitForPaint( page ) {
	await page.evaluate(
		() =>
			new Promise( ( resolve ) =>
				requestAnimationFrame( () => requestAnimationFrame( resolve ) )
			)
	);
}

/**
 * Waits until a story is ready for its screenshot.
 *
 * @since n.e.x.t
 *
 * @param {Object} page     The Playwright page.
 * @param {Object} scenario The scenario.
 * @param {Object} network  The page's network tracker, from `fixtures.js`.
 */
async function waitForStoryReady( page, scenario, network ) {
	await waitForStoryRender( page );

	const renderedAt = Date.now();

	await network.waitForQuiet( NETWORK_QUIET_MS, NETWORK_TIMEOUT );
	await waitForCharts( page );
	await waitForDOMQuiet( page );

	if ( scenario.readySelector ) {
		await page
			.locator( scenario.readySelector )
			.first()
			.waitFor( { state: 'attached', timeout: RENDER_TIMEOUT } );
	}

	// `delay` is the least time to wait after the story renders.
	const remainingDelay =
		( scenario.delay || 0 ) - ( Date.now() - renderedAt );

	if ( remainingDelay > 0 ) {
		await page.waitForTimeout( remainingDelay );
	}

	await waitForPaint( page );
}

/**
 * Waits for the page to settle after an interaction.
 *
 * @since n.e.x.t
 *
 * @param {Object} page    The Playwright page.
 * @param {Object} network The page's network tracker, from `fixtures.js`.
 */
async function waitForSettled( page, network ) {
	await network.waitForQuiet( NETWORK_QUIET_MS, NETWORK_TIMEOUT );
	await waitForDOMQuiet( page );
	await waitForPaint( page );
}

module.exports = {
	waitForPaint,
	waitForSettled,
	waitForStoryReady,
};
