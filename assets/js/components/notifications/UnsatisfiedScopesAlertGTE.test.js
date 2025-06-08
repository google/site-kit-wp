/**
 * UnsatisfiedScopesAlertGTE component tests.
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
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '../../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import UnsatisfiedScopesAlertGTE from './UnsatisfiedScopesAlertGTE';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { MODULE_SLUG_ANALYTICS_4 } from '../../modules/analytics-4/constants';

const NotificationWithComponentProps = withNotificationComponentProps(
	'authentication-error'
)( UnsatisfiedScopesAlertGTE );

describe( 'UnsatisfiedScopesAlertGTE', () => {
	let registry;

	const notification = DEFAULT_NOTIFICATIONS[ 'authentication-error-gte' ];

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/tagmanager.readonly',
			],
		} );
	} );

	it( 'should display the alert', async () => {
		const { getByText, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText(
				'Site Kit needs additional permissions to detect updates to tags on your site'
			)
		).toBeInTheDocument();
	} );

	describe( 'checkRequirements', () => {
		it( 'is active', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when there is a setup error', async () => {
			provideSiteInfo( registry, {
				proxySupportLinkURL: 'https://test.com',
				setupErrorCode: 'error_code',
				setupErrorMessage: 'An error occurred',
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the user is not authenticated', async () => {
			provideUserAuthentication( registry, {
				authenticated: false,
				unsatisfiedScopes: [
					'https://www.googleapis.com/auth/tagmanager.readonly',
				],
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the user does have the Tag Manager scope', async () => {
			provideUserAuthentication( registry, {
				authenticated: true,
				grantedScopes: [
					'https://www.googleapis.com/auth/tagmanager.readonly',
				],
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );
} );
