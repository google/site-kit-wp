/**
 * activateAMPWithMode utility.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * The allow list of AMP modes.
 */
export const allowedAMPModes = {
	primary: 'standard',
	secondary: 'transitional',
	standard: 'standard',
	transitional: 'transitional',
	reader: 'disabled',
};

/**
 * Activate AMP and set it to the correct mode.
 *
 * @param {string} mode The mode to set AMP to. Possible value of standard, transitional or reader.
 */
export const activateAMPWithMode = async ( mode ) => {
	await activatePlugin( 'amp' );
	await setAMPMode( mode );
};

/**
 * Set AMP Mode
 *
 * @param {string} mode The mode to set AMP to. Possible value of standard, transitional or reader.
 */
export const setAMPMode = async ( mode ) => {
	// Test to be sure that the passed mode is known.
	expect( allowedAMPModes ).toHaveProperty( mode );
	const ampMode = allowedAMPModes[ mode ];
	// Set the AMP mode
	await visitAdminPage( 'admin.php', 'page=amp-options' );
	// Compound selector for mode for compatibility between AMP versions (v1,v2)
	await expect( page ).toClick(
		`#theme_support_${ ampMode },#template-mode-${ ampMode }`
	);
	// In AMP v2, the submit button is disabled until settings have changed.
	const submitDisabled = await page.$eval( '#amp-settings button[type="submit"]', ( { disabled } ) => disabled );
	// If disabled, it is already configured to use the mode we want.
	if ( ! submitDisabled ) {
		await expect( page ).toClick( '#amp-settings button[type="submit"]' );
		await page.waitForNavigation();
	}
};
