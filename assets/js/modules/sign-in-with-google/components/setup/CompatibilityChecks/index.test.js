/**
 * Sign in with Google CompatibilityChecks component tests.
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

/**
 * Internal dependencies
 */
import { render, waitFor } from '../../../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../../../tests/js/utils';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import CompatibilityChecks from './index';

describe( 'CompatibilityChecks', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'displays progress indicator while compatibility checks load', async () => {
		const endpoint = new RegExp(
			'^/google-site-kit/v1/modules/sign-in-with-google/data/compatibility-checks'
		);

		fetchMock.getOnce( endpoint, {
			body: {
				checks: {},
				timestamp: Date.now(),
			},
			status: 200,
		} );

		const { container, waitForRegistry } = render(
			<CompatibilityChecks />,
			{ registry }
		);

		expect( container ).toHaveTextContent( 'Checking Compatibility…' );

		await waitForRegistry();

		await waitFor( () => {
			expect(
				container.querySelector( '.mdc-linear-progress' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'renders fallback warning for conflicting plugins without bespoke message', async () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetCompatibilityChecks( {
				checks: {
					conflicting_plugins: {
						'hide-login/hide-login.php': {
							pluginName: 'Hide Login',
							conflictMessage: null,
						},
					},
				},
				timestamp: Date.now(),
			} );

		const { container, waitForRegistry } = render(
			<CompatibilityChecks />,
			{
				registry,
			}
		);

		await waitForRegistry();

		await waitFor( () => {
			expect( container ).toHaveTextContent(
				'Hide Login can interfere with Sign in with Google. When this plugin is active, Sign in with Google may not function properly'
			);
		} );
	} );

	it( 'renders bespoke warning message when provided for conflicting plugins', async () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetCompatibilityChecks( {
				checks: {
					conflicting_plugins: {
						'security/security.php': {
							pluginName: 'Security',
							conflictMessage:
								'Security requires additional configuration to work with Sign in with Google.',
						},
					},
				},
				timestamp: Date.now(),
			} );

		const { container, waitForRegistry } = render(
			<CompatibilityChecks />,
			{
				registry,
			}
		);

		await waitForRegistry();

		await waitFor( () => {
			expect( container ).toHaveTextContent(
				'Security requires additional configuration to work with Sign in with Google.'
			);
		} );
	} );

	it( 'renders warning when WordPress login is inaccessible', async () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetCompatibilityChecks( {
				checks: {
					wp_login_inaccessible: true,
				},
				timestamp: Date.now(),
			} );

		const { container, waitForRegistry } = render(
			<CompatibilityChecks />,
			{
				registry,
			}
		);

		await waitForRegistry();

		await waitFor( () => {
			expect( container ).toHaveTextContent(
				'Your login page (wp-login.php) is not accessible at the expected location. This can prevent Sign in with Google from functioning correctly.'
			);
		} );
	} );

	it( 'renders warning when site is hosted on wordpress.com', async () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetCompatibilityChecks( {
				checks: {
					host_wordpress_dot_com: true,
				},
				timestamp: Date.now(),
			} );

		const { container, waitForRegistry } = render(
			<CompatibilityChecks />,
			{
				registry,
			}
		);

		await waitForRegistry();

		await waitFor( () => {
			expect( container ).toHaveTextContent(
				'Sign in with Google does not function on sites hosted on wordpress.com.'
			);
		} );
	} );

	it( 'renders nothing when there are no compatibility issues', async () => {
		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetCompatibilityChecks( {
				checks: {},
				timestamp: Date.now(),
			} );

		const { container, waitForRegistry } = render(
			<CompatibilityChecks />,
			{
				registry,
			}
		);

		await waitForRegistry();

		await waitFor( () => {
			expect( container ).toBeEmptyDOMElement();
		} );
	} );
} );
