/**
 * Plugin activation tests.
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
import { test, expect, TestDetails } from '../playwright';
import { asUser } from '../options';

const details: TestDetails = {
	annotation: [ asUser( 'admin' ) ],
};

test.describe( 'plugin activation notice', details, () => {
	test( 'should be displayed when using proxy auth', async ( { wp } ) => {
		await wp.deactivatePlugin( 'google-site-kit' );
		await wp.activatePlugin( 'e2e-tests-proxy-credentials-plugin' );
		await wp.activatePlugin( 'google-site-kit' );
		await wp.page.waitForLoadState( 'networkidle' );
		await expect(
			wp.page.locator( '.googlesitekit-activation__title' )
		).toContainText(
			/Congratulations, the Site Kit plugin is now activated/i
		);
	} );

	test( 'should not display noscript notice when using proxy auth', async ( {
		wp,
	} ) => {
		await wp.deactivatePlugin( 'google-site-kit' );
		await wp.activatePlugin( 'e2e-tests-proxy-credentials-plugin' );
		await wp.activatePlugin( 'google-site-kit' );
		await wp.page.waitForLoadState( 'networkidle' );
		await expect(
			wp.page.locator( '.googlesitekit-noscript' )
		).toHaveCount( 0 );
	} );

	test( 'should be displayed when using GCP auth', async ( { wp } ) => {
		await wp.deactivatePlugin( 'google-site-kit' );
		await wp.activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		await wp.activatePlugin( 'google-site-kit' );
		await wp.page.waitForLoadState( 'networkidle' );
		await expect(
			wp.page.locator( '.googlesitekit-activation__title' )
		).toContainText(
			/Congratulations, the Site Kit plugin is now activated/i
		);
	} );

	test( 'should not display noscript notice when using GCP auth', async ( {
		wp,
	} ) => {
		await wp.deactivatePlugin( 'google-site-kit' );
		await wp.activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		await wp.activatePlugin( 'google-site-kit' );
		await wp.page.waitForLoadState( 'networkidle' );
		await expect(
			wp.page.locator( '.googlesitekit-noscript' )
		).toHaveCount( 0 );
	} );

	test( 'should lead you to the setup wizard with GCP auth', async ( {
		wp,
	} ) => {
		await wp.deactivatePlugin( 'google-site-kit' );
		await wp.activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		await wp.activatePlugin( 'google-site-kit' );
		await wp.page.waitForLoadState( 'networkidle' );
		await expect(
			wp.page.locator( '.googlesitekit-start-setup' )
		).toHaveText( 'Start setup' );
		await wp.page.locator( '.googlesitekit-start-setup' ).click();
		await wp.page.waitForSelector( '.googlesitekit-wizard-step__title' );
		await expect(
			wp.page.locator(
				'.googlesitekit-wizard-progress-step__number--inprogress'
			)
		).toHaveText( '1' );
	} );
} );
