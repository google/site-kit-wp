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
import { expect, test } from '../../playwright';
import { asUser, withFixtures, withPlugins } from '../../wordpress';

const user = asUser( 'admin' );
const plugins = withPlugins(
	'proxy-auth.php',
	'mock-analytics-scopes-revoked.php'
);
const fixtures = withFixtures( 'core/reauthentication-notice' );

test.describe(
	'Reauthentication needed admin notice',
	{ annotation: [ user, plugins, fixtures ] },
	() => {
		test( 'should redirect to analytics setup after reauth if the flow has been previously interrupted', async ( {
			wp,
		} ) => {
			let simulateAbandonSetup = true;

			// Intercepting the external sitekit.withgoogle.com navigation
			// directly doesn't work reliably: Chromium swaps renderer
			// processes for a cross-origin top-level navigation, and that
			// swap loses the route before the document request is sent (its
			// sub-resources get intercepted just fine afterwards, but not
			// the initial navigation itself). Instead, intercept the
			// same-origin request that *produces* that redirect and rewrite
			// its Location header before the browser ever leaves the site,
			// letting WP's own connect-action handler run for real.
			await wp.page.route(
				/\/wp-admin\/index\.php\?action=googlesitekit_connect/,
				async ( route ) => {
					const response = await route.fetch( { maxRedirects: 0 } );
					const realLocation = response.headers().location;

					if (
						! realLocation ||
						! realLocation.startsWith(
							'https://sitekit.withgoogle.com/'
						)
					) {
						await route.fulfill( { response } );
						return;
					}

					const location = simulateAbandonSetup
						? `${ wp.baseURL }/wp-admin/index.php`
						: `${ wp.baseURL }/wp-admin/index.php?oauth2callback=1&code=valid-test-code`;

					await route.fulfill( {
						response,
						status: 302,
						headers: { ...response.headers(), location },
					} );
				}
			);

			await wp.step(
				'Set up Analytics from Connect more services',
				async () => {
					await wp.visitSettings();

					await wp.page
						.locator( '.mdc-tab', {
							hasText: /connect more services/i,
						} )
						.click();

					await wp.page
						.locator( '.googlesitekit-cta-link', {
							hasText: /set up analytics/i,
						} )
						.click();

					await expect(
						wp.page.locator(
							'#googlesitekit-notice-needs_reauthentication'
						)
					).toBeVisible();
				}
			);

			await wp.step(
				'Complete the interrupted reauthentication',
				async () => {
					simulateAbandonSetup = false;

					await wp.page
						.locator(
							'#googlesitekit-notice-needs_reauthentication'
						)
						.getByText( /click here/i )
						.click();

					await wp.page.waitForURL( /slug=analytics-4/ );

					await expect(
						wp.page.locator(
							'.googlesitekit-setup-module--analytics'
						)
					).toBeVisible();
				}
			);
		} );
	}
);
