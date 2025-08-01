/**
 * Custom onReady script for BackstopJS.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

const POLLING_INTERVAL_MS = 100;
const FONT_WAIT_TIMEOUT_MS = 5000;

/**
 * Creates a promise that resolves after a specified delay.
 *
 * @since 1.158.0
 *
 * @param {number} ms The delay in milliseconds.
 * @return {Promise<void>} A promise that resolves after the delay.
 */
const waitForTimeout = ( ms ) =>
	new Promise( ( resolve ) => setTimeout( resolve, ms ) );

/**
 * Executes custom waiting logic before taking screenshots.
 *
 * This script applies specific waiting logic based on the scenario label.
 * Scenarios don't support passing function props therefore waiting logic
 * is implemented here and triggered via text props.
 *
 * @since 1.158.0
 *
 * @param {Object} page     The Puppeteer page object.
 * @param {Object} scenario The scenario configuration.
 * @param {Object} viewport The viewport configuration.
 */
module.exports = async ( page, scenario, viewport ) => {
	// NOTE: We can implement waitForRegistry or other non-arbitrary time based delays here to improve test stability for other VRTs.

	// Reset the font size of the specific selector and retrigger resize events.
	if ( scenario.resetDataBlockGroup ) {
		await page.evaluate( () => {
			const dataBlocks = document.querySelectorAll(
				'.googlesitekit-data-block__datapoint'
			);
			dataBlocks.forEach( ( block ) => {
				block.style.fontSize = '';
			} );
		} );
		// Force resize event to trigger new font size calculations.
		await page.setViewport( {
			width: viewport.width + 1,
			height: viewport.height + 1,
			deviceScaleFactor: 1,
		} );

		await waitForTimeout( POLLING_INTERVAL_MS );

		await page.setViewport( {
			width: viewport.width,
			height: viewport.height,
			deviceScaleFactor: 1,
		} );

		await waitForTimeout( POLLING_INTERVAL_MS );
	}

	// Wait for the font size to match the expected size for the current viewport.
	// This is currently used for the DashboardOverallPageMetricsWidgetGA4 story which uses the DataBlockGroup component.
	if ( scenario.waitForFontSizeToMatch && scenario.fontSizeSelector ) {
		const expectedFontSizes = {
			small: scenario.expectedFontSizeSmall || false,
			medium: scenario.expectedFontSizeMedium || false,
			large: scenario.expectedFontSizeLarge || false,
		};
		const expectedFontSize = expectedFontSizes[ viewport.label ];

		if ( expectedFontSize === false ) {
			return;
		}

		await page.waitForFunction(
			( selector, targetFontSize ) => {
				const elements = document.querySelectorAll( selector );

				if ( ! elements.length ) {
					return false;
				}

				const currentFontSizes = Array.from( elements ).map( ( el ) => {
					const fontSize = el.style.fontSize;
					return fontSize ? parseInt( fontSize, 10 ) : 0;
				} );

				return currentFontSizes.every(
					( size ) => size === targetFontSize
				);
			},
			{
				timeout: FONT_WAIT_TIMEOUT_MS,
				polling: POLLING_INTERVAL_MS,
			},
			scenario.fontSizeSelector,
			expectedFontSize
		);
	}
};
