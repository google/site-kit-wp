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
import { asUser, withPlugins } from '../wordpress';

const details: TestDetails = {
	annotation: [ asUser( 'admin' ) ],
};

test.describe( 'plugin activation', details, () => {
	test.beforeEach( async ( { wp } ) => {
		await wp.deactivatePlugin( 'google-site-kit/google-site-kit.php' );

		await wp.visitAdmin( 'plugins.php' );

		await wp.page
			.getByRole( 'link', { name: 'Activate Site Kit by Google' } )
			.click();
	} );

	test( 'should display the activation notice', async ( { wp } ) => {
		const title = wp.page.getByRole( 'heading', {
			name: 'Congratulations, the Site Kit',
		} );

		await expect( title ).toBeVisible();
	} );

	test( 'should lead to the splash screen', async ( { wp } ) => {
		await wp.page.getByRole( 'button', { name: 'Start setup' } ).click();

		const title = wp.page.getByRole( 'heading', {
			name: 'Set up Site Kit',
		} );

		await expect( title ).toBeVisible();
	} );

	test(
		'should lead to the setup wizard with GCP authentication',
		{
			annotation: withPlugins( 'gcp-credentials.php' ),
		},
		async ( { wp } ) => {
			await wp.page
				.getByRole( 'button', { name: 'Start setup' } )
				.click();

			const title = wp.page.getByRole( 'heading', {
				name: 'Authenticate with Google',
			} );

			await expect( title ).toBeVisible();
		}
	);
} );
