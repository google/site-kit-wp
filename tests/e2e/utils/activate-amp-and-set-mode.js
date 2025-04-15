/**
 * `activateAMPWithMode` utility.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Internal dependencies
 */
import { createWaitForFetchRequests } from './create-wait-for-fetch-requests';
import { pageWait } from './page-wait';
import { useRequestInterception } from './use-request-interception';

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
 * Activates AMP and set it to the correct mode.
 *
 * @since 1.10.0
 * @since 1.93.0 Added request interception for AMP validation requests.
 *
 * @param {string}   mode                                      The mode to set AMP to. Possible value of standard, transitional or reader.
 * @param {Object}   sharedRequestInterception                 Object of methods that can be called to remove the added handler function from the page and add new request cases.
 * @param {Function} sharedRequestInterception.cleanUp         Removes the request handler function from the page.
 * @param {Function} sharedRequestInterception.addRequestCases Adds new request cases to the request handler function.
 * @return {Promise<void>} Promise that resolves when AMP is activated and set to the correct mode.
 */
export const activateAMPWithMode = async (
	mode,
	sharedRequestInterception
) => {
	// On newer versions of AMP, setting up AMP invokes a number of validation requests which add a large
	// amount of time to the process and are ultimately unnecessary.
	// To avoid this, we configure request interception for these to bypass them as needed.
	// See https://github.com/google/site-kit-wp/issues/5460#issuecomment-1335180571
	if ( sharedRequestInterception ) {
		sharedRequestInterception.addRequestCases( [
			{
				isMatch: ( request ) => request.url().match( '&amp_validate' ),
				getResponse: () => ( {
					status: 200,
					body: JSON.stringify( {} ),
				} ),
			},
		] );
	} else {
		// If no sharedRequestInterception is passed, we need to create a new request interception.
		useRequestInterception( ( request ) => {
			if ( request.url().match( '&amp_validate' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {} ),
				} );
			}
		} );
	}
	await activatePlugin( 'amp' );
	await setAMPMode( mode );
};

function debugLog( message ) {
	// if ( ! shouldLog() ) {
	// 	return;
	// }

	// `currentTestName` is the full test name (including describe names)
	const currentTest = expect.getState().currentTestName;

	// eslint-disable-next-line no-console
	console.debug( `DEBUG: ${ message } [${ currentTest }]` );
}

/**
 * Sets AMP Mode.
 *
 * @since 1.10.0
 *
 * @param {string} mode The mode to set AMP to. Possible value of standard, transitional or reader.
 */
export const setAMPMode = async ( mode ) => {
	debugLog( `setAMPMode, mode = ${ mode }` );
	debugLog( 'setAMPMode, expect allowedAMPModes to have mode' );

	// Test to be sure that the passed mode is known.
	expect( allowedAMPModes ).toHaveProperty( mode );

	debugLog( 'setAMPMode, expect allowedAMPModes to have mode done' );

	const ampMode = allowedAMPModes[ mode ];

	debugLog( 'setAMPMode, createWaitForFetchRequests' );

	// Need to start capturing before navigating to the AMP page.
	const waitForFetchRequests = createWaitForFetchRequests();

	debugLog( 'setAMPMode, visitAdminPage' );

	// Set the AMP mode
	await visitAdminPage( 'admin.php', 'page=amp-options' );

	debugLog( 'setAMPMode, get optionsRESTPath' );

	// AMP v2
	const optionsRESTPath = await page.evaluate(
		() => window.ampSettings && window.ampSettings.OPTIONS_REST_PATH
	);

	debugLog( `setAMPMode, got optionsRESTPath: ${ optionsRESTPath }` );

	if ( optionsRESTPath ) {
		debugLog( 'setAMPMode, waitForSelector' );
		await page.waitForSelector( `#template-mode-${ ampMode }` );

		debugLog( 'setAMPMode, get isAlreadySet' );

		const isAlreadySet = await page.evaluate( ( theAMPMode ) => {
			const templateMode = document.querySelector(
				`#template-mode-${ theAMPMode }`
			);
			return templateMode.checked;
		}, ampMode );

		debugLog( `setAMPMode, got isAlreadySet: ${ isAlreadySet }` );

		if ( isAlreadySet ) {
			debugLog( 'setAMPMode, isAlreadySet, pageWait' );
			await pageWait();
			debugLog( 'setAMPMode, isAlreadySet, waitForFetchRequests' );
			await waitForFetchRequests();
			debugLog( 'setAMPMode, isAlreadySet, done' );
			return;
		}

		debugLog( 'setAMPMode, click radio button' );
		await page.evaluate( ( theAMPMode ) => {
			const radio = document.querySelector(
				`#template-mode-${ theAMPMode }`
			);
			radio.click();
		}, ampMode );

		debugLog( 'setAMPMode, click submit button' );
		await page.click( 'button[type="submit"]' );

		debugLog( 'setAMPMode, pageWait' );
		await pageWait();

		debugLog( 'setAMPMode, waitForFetchRequests' );
		await waitForFetchRequests();

		debugLog( 'setAMPMode, done' );
		return;
	}

	// AMP v1
	await expect( page ).toClick( `#theme_support_${ ampMode }` );
	await expect( page ).toClick( '#submit' );
	await waitForFetchRequests();
	await page.waitForNavigation();
};
