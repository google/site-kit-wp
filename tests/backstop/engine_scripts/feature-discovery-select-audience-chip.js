/**
 * Backstop helper for Feature Discovery filtered story.
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
 * Internal dependencies
 */
const onReady = require( './puppet/onReady' );

const AUDIENCE_CHIP_SELECTOR =
	'.googlesitekit-category-filter-chips .mdc-chip[data-chip-id="audience"]';
const ALL_SERVICES_CHIP_SELECTOR =
	'.googlesitekit-category-filter-chips .mdc-chip[data-chip-id="all-services"]';

module.exports = async (
	page,
	scenario,
	viewport,
	isReference,
	Engine,
	config
) => {
	await onReady( page, scenario, viewport, isReference, Engine, config );

	await page.waitForSelector( AUDIENCE_CHIP_SELECTOR );

	await page.evaluate( ( audienceSelector ) => {
		const audienceChip = document.querySelector( audienceSelector );

		if (
			audienceChip &&
			! audienceChip.classList.contains( 'mdc-chip--selected' )
		) {
			audienceChip.dispatchEvent(
				new MouseEvent( 'click', { bubbles: true } )
			);
		}
	}, AUDIENCE_CHIP_SELECTOR );

	await page.waitForFunction(
		( audienceSelector, allServicesSelector ) => {
			const audienceChip = document.querySelector( audienceSelector );
			const allServicesChip =
				document.querySelector( allServicesSelector );

			return (
				audienceChip?.classList.contains( 'mdc-chip--selected' ) &&
				! allServicesChip?.classList.contains( 'mdc-chip--selected' )
			);
		},
		{},
		AUDIENCE_CHIP_SELECTOR,
		ALL_SERVICES_CHIP_SELECTOR
	);
};
