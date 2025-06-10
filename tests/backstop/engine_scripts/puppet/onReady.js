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
 */
module.exports = async ( page, scenario ) => {
	// NOTE: We can implement waitForRegistry or other not arbitrary time based delays here to improve test stability.

	// Wait for font resizing to complete before taking screenshots.
	if (
		scenario.customWaitFunction === 'waitForFontSizeToStabalize' &&
		scenario.fontSizeSelector
	) {
		await page.evaluate( ( selector ) => {
			return new Promise( ( resolve ) => {
				// Function to check if font sizes have stabilized in a given selector.
				const checkFontSizes = () => {
					const elements = document.querySelectorAll( selector );

					if ( ! elements.length ) {
						setTimeout( checkFontSizes, 100 );
						return;
					}

					const fontSizes = Array.from( elements ).map(
						( el ) => window.getComputedStyle( el ).fontSize
					);

					// Store initial font sizes
					const initialFontSizes = [ ...fontSizes ];

					setTimeout( () => {
						const newFontSizes = Array.from( elements ).map(
							( el ) => window.getComputedStyle( el ).fontSize
						);

						const stable = initialFontSizes.every(
							( size, i ) => size === newFontSizes[ i ]
						);

						if ( stable ) {
							resolve();
						} else {
							// If not stable, check again.
							setTimeout( checkFontSizes, 100 );
						}
					}, 100 );
				};

				checkFontSizes();
			} );
		}, scenario.fontSizeSelector );
	}
};
