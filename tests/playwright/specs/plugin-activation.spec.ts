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
import { test, expect, TestDetails, WordPressFixture } from '../playwright';
import { asUser, withPlugins } from '../wordpress';

/**
 * Creates a test that checks for a setup screen with the given name.
 *
 * @since n.e.x.t
 *
 * @param name The name of the setup screen to check for.
 * @return    A test function that checks for the setup screen.
 */
function makeSetupTest( name: string ) {
	return async ( { wp }: WordPressFixture ) => {
		await test.step( 'Click `Start setup` button', () => {
			return wp.page
				.getByRole( 'button', { name: 'Start setup' } )
				.click();
		} );

		await test.step( 'Check the screen title', () => {
			const title = wp.page.getByRole( 'heading', {
				name,
			} );

			return expect( title ).toBeVisible();
		} );
	};
}

const details: TestDetails = {
	annotation: [ asUser( 'admin' ) ],
};

test.describe( 'plugin activation', details, () => {
	test.beforeEach( async ( { wp } ) => {
		await wp.deactivatePlugin( 'google-site-kit/google-site-kit.php' );

		await wp.visitAdmin( 'plugins.php' );

		await test.step( 'Activate the Site Kit plugin', () => {
			return wp.page
				.getByRole( 'link', { name: 'Activate Site Kit by Google' } )
				.click();
		} );
	} );

	test( 'should display the activation notice', ( { wp } ) => {
		return test.step( 'Check the notice title', () => {
			const title = wp.page.getByRole( 'heading', {
				name: 'Congratulations, the Site Kit',
			} );

			return expect( title ).toBeVisible();
		} );
	} );

	test(
		'should lead to the splash screen',
		makeSetupTest( 'Set up Site Kit' )
	);

	test(
		'should lead to the setup wizard with GCP authentication',
		{
			annotation: withPlugins( 'gcp-credentials.php' ),
		},
		makeSetupTest( 'Authenticate with Google' )
	);
} );
