/**
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
import { test, expect } from '../playwright';
import { asUser, withFeatureFlags, withPlugins } from '../wordpress';

const user = asUser( 'admin' );
const plugins = withPlugins( 'proxy-auth.php' );

test.describe( 'Golinks', { annotation: [ user, plugins ] }, () => {
	test( 'should redirect to dashboard', async ( { wp } ) => {
		await wp.visitAdmin( 'index.php?action=googlesitekit_go&to=dashboard' );
		await expect(
			wp.page.getByRole( 'heading', {
				name: 'Find out how your audience is growing',
			} )
		).toBeVisible();
	} );

	test( 'should forward URL parameters', async ( { wp } ) => {
		await wp.visitAdmin(
			'index.php?action=googlesitekit_go&to=dashboard&slug=analytics-4&reAuth=true&permaLink=http%3A%2F%2Flocalhost%3A9002%2Fhello-world%2F'
		);
		await expect(
			wp.page.getByRole( 'heading', {
				name: 'Find out how your audience is growing',
			} )
		).toBeVisible();
		await expect( wp.page ).toHaveURL( /slug=analytics-4/ );
		await expect( wp.page ).toHaveURL( /reAuth=true/ );
		await expect( wp.page ).toHaveURL(
			/permaLink=http%3A%2F%2Flocalhost%3A9002%2Fhello-world%2F/
		);
	} );

	test( 'should fail if the link is invalid', async ( { wp } ) => {
		await wp.visitAdmin(
			'index.php?action=googlesitekit_go&to=invalid-key'
		);
		await expect(
			wp.page.locator( 'p', {
				hasText: 'The link you followed is invalid.',
			} )
		).toBeVisible();
	} );

	test( 'should fail if the PUE feature flag is not enabled', async ( {
		wp,
	} ) => {
		await wp.visitAdmin(
			'index.php?action=googlesitekit_go&to=manage-subscription-email-reporting'
		);
		await expect(
			wp.page.locator( 'p', {
				hasText: 'The link you followed is invalid.',
			} )
		).toBeVisible();
	} );

	test(
		'should redirect and open the email reporting panel if the PUE feature flag is enabled',
		{ annotation: [ withFeatureFlags( 'proactiveUserEngagement' ) ] },
		async ( { wp } ) => {
			await wp.visitAdmin(
				'index.php?action=googlesitekit_go&to=manage-subscription-email-reporting'
			);
			await expect(
				wp.page.getByRole( 'heading', {
					name: 'Email reports subscription',
				} )
			).toBeVisible();
		}
	);

	test(
		'should redirect to settings page if the PUE feature flag is enabled',
		{ annotation: [ withFeatureFlags( 'proactiveUserEngagement' ) ] },
		async ( { wp } ) => {
			await wp.visitAdmin(
				'index.php?action=googlesitekit_go&to=settings&module=analytics-4'
			);
			await expect(
				wp.page.getByRole( 'heading', {
					name: 'Settings',
				} )
			).toBeVisible();
			await expect( wp.page ).toHaveURL(
				/connected-services\/analytics-4/
			);
		}
	);
} );
