/**
 * UnsatisfiedScopesAlert component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	render,
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	fireEvent,
	provideSiteInfo,
	provideModuleRegistrations,
	act,
} from '../../../../../tests/js/test-utils';
import { deleteItem, setItem } from '@/js/googlesitekit/api/cache';
import { mockLocation } from '../../../../../tests/js/mock-browser-utils';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import UnsatisfiedScopesAlert from '.';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';

const NotificationWithComponentProps = withNotificationComponentProps(
	'authentication-error'
)( UnsatisfiedScopesAlert );

describe( 'UnsatisfiedScopesAlert', () => {
	mockLocation();

	let registry;

	const moduleActivationEndpoint = RegExp(
		'google-site-kit/v1/core/modules/data/activation'
	);
	const userAuthenticationEndpoint = RegExp(
		'/google-site-kit/v1/core/user/data/authentication'
	);

	const notification = DEFAULT_NOTIFICATIONS[ 'authentication-error' ];

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/analytics.readonly',
			],
		} );

		// Ensure the storage item is unavailable by default.
		deleteItem( 'module_setup' );
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
			getByText( 'Site Kit can’t access necessary data' )
		).toBeInTheDocument();
	} );

	it( 'should have a CTA that says "Redo setup" that navigates the user to the connect URL', async () => {
		const { getByRole, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const ctaButton = getByRole( 'button', { name: /Redo setup/i } );

		const connectURL = registry.select( CORE_USER ).getConnectURL( {
			redirectURL: global.location.href,
		} );

		expect( ctaButton ).toBeInTheDocument();

		expect( ctaButton ).toHaveAttribute( 'href', connectURL );
	} );

	it( 'should have a CTA that retries module activation when the alert appears during the module setup', async () => {
		fetchMock.postOnce( moduleActivationEndpoint, {
			body: { success: true },
		} );
		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		setItem( 'module_setup', MODULE_SLUG_ANALYTICS_4 );

		const { getByRole, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const ctaButton = getByRole( 'button', {
			name: /Redo setup/i,
		} );

		expect( ctaButton ).toBeInTheDocument();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( ctaButton );
		} );

		expect( fetchMock ).toHaveFetched( moduleActivationEndpoint );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is active when GA4 is connected but there are multiple unsatisfied scopes', async () => {
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
					'https://www.googleapis.com/auth/analytics.readonly',
				],
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when GA4 is connected but the only unsatisfied scope is the tagmanager readonly scope', async () => {
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

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active if the user is not authenticated', async () => {
			provideUserAuthentication( registry, {
				authenticated: false,
				unsatisfiedScopes: [
					'https://www.googleapis.com/auth/analytics.readonly',
				],
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active if the user does not have unsatisfied scopes', async () => {
			provideUserAuthentication( registry, {
				authenticated: true,
				unsatisfiedScopes: [],
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBeFalsy();
		} );
	} );
} );
