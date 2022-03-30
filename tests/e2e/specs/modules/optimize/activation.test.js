/**
 * Optimize module activation tests.
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
import {
	activatePlugin,
	deactivatePlugin,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	activateAMPWithMode,
	deactivateUtilityPlugins,
	resetSiteKit,
	setSearchConsoleProperty,
	setSiteVerification,
	setupAnalytics,
	step,
	useRequestInterception,
} from '../../../utils';

async function proceedToOptimizeSetup() {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

	await page.waitForSelector( '.mdc-tab-bar' );
	await expect( page ).toClick( '.mdc-tab', {
		text: /connect more services/i,
	} );

	await page.waitForSelector(
		'.googlesitekit-settings-connect-module--optimize'
	);

	await Promise.all( [
		page.waitForNavigation(),
		page.waitForSelector(
			'.googlesitekit-setup-module--optimize .googlesitekit-setup-module__title'
		),
		expect( page ).toClick( '.googlesitekit-cta-link', {
			text: /set up optimize/i,
		} ),
	] );
}

describe( 'Optimize Activation', () => {
	async function finishOptimizeSetup() {
		await step( 'submit the form', () => {
			return Promise.all( [
				page.waitForNavigation(),
				expect( page ).toClick(
					'.googlesitekit-setup-module--optimize button',
					{
						text: /Configure Optimize/i,
					}
				),
			] );
		} );

		await step( 'wait for congrats message', () => {
			return expect( page ).toMatchElement(
				'.googlesitekit-publisher-win__title',
				{
					text: /Congrats on completing the setup for Optimize!/i,
				}
			);
		} );
	}

	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.match(
						'/wp-json/google-site-kit/v1/modules/analytics/data/report?'
					)
			) {
				request.respond(
					{
						status: 200,
						body: JSON.stringify( [
							{ placeholder_response: true },
						] ),
					},
					10
				);
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			) {
				request.respond(
					{ status: 200, body: JSON.stringify( {} ) },
					10
				);
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
					)
			) {
				request.respond(
					{ status: 200, body: JSON.stringify( {} ) },
					10
				);
			} else if (
				request
					.url()
					.match( 'google-site-kit/v1/modules/analytics/data/goals' )
			) {
				request.respond(
					{ status: 200, body: JSON.stringify( {} ) },
					10
				);
			} else {
				request.continue( {}, 5 );
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'prompts to insert your Optimize ID when Analytics snippet is enabled', async () => {
		await setupAnalytics( { useSnippet: true } );
		await proceedToOptimizeSetup();

		const setupHandle = await page.$(
			'.googlesitekit-setup-module--optimize'
		);
		await expect( setupHandle ).toMatchElement(
			'.googlesitekit-setup-module__title',
			{
				text: /Optimize/i,
			}
		);
		await expect( setupHandle ).toMatchElement( 'p', {
			text: /Please copy and paste your Optimize ID to complete your setup/i,
		} );
		// Not able to use negation here for some reason.
		// await expect( setupHandle ).not.toMatchElement( 'p', { text: /You disabled analytics auto insert snippet. If you are using Google Analytics code snippet, add the code below/i, visible: true } );
		// await expect( setupHandle ).not.toMatchElement( 'p', { text: /Click here for how to implement Optimize tag in Google Analytics Code Snippet/i } );

		await expect( setupHandle ).toFill( 'input', 'gtm' );
		await expect( setupHandle ).toMatchElement(
			'.googlesitekit-error-text',
			{ text: /Error: Not a valid Optimize ID./i }
		);
		await expect( setupHandle ).toFill( 'input', 'GTM-1234567' );
		await expect( setupHandle ).not.toMatchElement(
			'.googlesitekit-error-text',
			{
				text: /Error: Not a valid Optimize ID./i,
			}
		);
		await setupHandle.dispose();

		await finishOptimizeSetup();
	} );

	it( 'prompts to insert your Optimize ID when Analytics snippet is disabled, with extra instructions', async () => {
		await setupAnalytics( { useSnippet: false } );
		await proceedToOptimizeSetup();

		const setupHandle = await page.$(
			'.googlesitekit-setup-module--optimize'
		);
		await expect( setupHandle ).toMatchElement(
			'.googlesitekit-setup-module__title',
			{
				text: /Optimize/i,
			}
		);
		await expect( setupHandle ).toMatchElement( 'p', {
			text: /Please copy and paste your Optimize ID to complete your setup/i,
		} );
		await expect( setupHandle ).toMatchElement( 'p', {
			text: /You disabled analytics auto insert snippet. If you are using Google Analytics code snippet, add the code below/i,
		} );
		await expect( setupHandle ).toMatchElement( 'p', {
			text: /Click here for how to implement Optimize tag in Google Analytics Code Snippet/i,
		} );

		await expect( setupHandle ).toFill( 'input', 'gtm' );
		await expect( setupHandle ).toMatchElement(
			'.googlesitekit-error-text',
			{ text: /Error: Not a valid Optimize ID./i }
		);
		await expect( setupHandle ).toFill( 'input', 'GTM-1234567' );
		await expect( setupHandle ).not.toMatchElement(
			'.googlesitekit-error-text',
			{
				text: /Error: Not a valid Optimize ID./i,
			}
		);
		await setupHandle.dispose();

		await finishOptimizeSetup();
	} );

	describe( 'Settings with AMP enabled', () => {
		beforeEach( async () => {
			await activateAMPWithMode( 'primary' );
			await setupAnalytics( { useSnippet: true } );
			await proceedToOptimizeSetup();
		} );

		afterEach( async () => {
			await deactivatePlugin( 'amp' );
			await resetSiteKit();
		} );

		it( 'displays AMP experimental JSON field', async () => {
			await expect( page ).toMatchElement(
				'.googlesitekit-setup-module--optimize p',
				{
					text: /Please input your AMP experiment settings in JSON format below./i,
				}
			);
		} );
	} );

	describe( 'Homepage AMP', () => {
		beforeEach( async () => {
			await activateAMPWithMode( 'primary' );
			await setupAnalytics();
		} );

		afterEach( async () => {
			await deactivatePlugin( 'amp' );
			await resetSiteKit();
		} );
		it( 'validates for logged-in users', async () => {
			await expect( '/' ).toHaveValidAMPForUser();
		} );
		it( 'validates for non-logged-in users', async () => {
			await expect( '/' ).toHaveValidAMPForVisitor();
		} );
	} );
} );
