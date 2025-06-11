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

/* eslint-disable no-restricted-globals */
/* eslint-disable no-console */

/**
 * Executes custom waiting logic before taking screenshots.
 *
 * This script applies specific waiting logic based on the scenario label.
 * Scenarios don't support passing function props therefore waiting logic
 * is implemented here and triggered via text props.
 *
 * @since n.e.x.t
 *
 * @param {Object} page     The Puppeteer page object.
 * @param {Object} scenario The scenario configuration.
 * @param {Object} viewport The viewport configuration.
 */
module.exports = async ( page, scenario, viewport ) => {
	// NOTE: We can implement waitForRegistry or other not arbitrary time based delays here to improve test stability.

	// Wait font size in selectors to match the expected size for the current viewport.
	// Currently used for the DashboardOverallPageMetricsWidgetGA4 story which uses the DataBlockGroup component.
	if ( scenario.waitForFontSizeToMatch && scenario.fontSizeSelector ) {
		const expectedFontSizes = {
			large: scenario.fontSizeLarge || false,
			medium: scenario.fontSizeMedium || false,
			small: scenario.fontSizeSmall || false,
		};
		const expectedFontSize = expectedFontSizes[ viewport.label ];

		if ( expectedFontSize === false ) {
			return;
		}

		await page.waitForFunction(
			( selector, targetFontSize, viewportLabel ) => {
				const elements = document.querySelectorAll( selector );

				if ( ! elements.length ) {
					console.log( 'No data block elements found, retrying...' );
					return false;
				}

				// Get current font sizes of all data blocks
				const currentFontSizes = Array.from( elements ).map( ( el ) => {
					const computedSize = window.getComputedStyle( el ).fontSize;
					// Convert "43px" to 43
					return parseInt( computedSize, 10 );
				} );

				console.log(
					`Current font sizes for ${ viewportLabel }:`,
					JSON.stringify( currentFontSizes )
				);
				console.log( `Expected font size: ${ targetFontSize }px` );

				// Check if all font sizes match the expected size for this viewport
				const allMatchExpected = currentFontSizes.every(
					( size ) => size === targetFontSize
				);

				if ( allMatchExpected ) {
					console.log(
						`✅ All font sizes match expected ${ targetFontSize }px for ${ viewportLabel } viewport`
					);
					return true;
				}
				console.log(
					"❌ Font sizes don't match expected size yet, retrying..."
				);
				return false;
			},
			{
				timeout: 5000,
				polling: 100,
			},
			scenario.fontSizeSelector,
			expectedFontSize,
			viewport.label
		);
	}
};
