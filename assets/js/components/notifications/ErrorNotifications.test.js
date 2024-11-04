/**
 * ErrorNotifications component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import ErrorNotifications from './ErrorNotifications';
import {
	render,
	createTestRegistry,
	provideUserAuthentication,
	provideModules,
	provideSiteInfo,
	provideNotifications,
	act,
} from '../../../../tests/js/test-utils';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '../../modules/tagmanager/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';

describe( 'ErrorNotifications', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'does not render UnsatisfiedScopesAlert when user is not authenticated', () => {
		provideUserAuthentication( registry, {
			authenticated: false,
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/analytics.readonly',
			],
		} );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		provideNotifications(
			registry,
			{
				'authentication-error':
					DEFAULT_NOTIFICATIONS[ 'authentication-error' ],
			},
			true
		);
		const { container } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'renders UnsatisfiedScopesAlert when user is authenticated', async () => {
		act( () => {
			provideUserAuthentication( registry, {
				grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				unsatisfiedScopes: [
					'https://www.googleapis.com/auth/analytics.readonly',
				],
			} );
			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );
			provideNotifications(
				registry,
				{
					'authentication-error':
						DEFAULT_NOTIFICATIONS[ 'authentication-error' ],
				},
				true
			);
		} );

		const { container, waitForRegistry } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Site Kit can’t access necessary data'
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'renders `Get help` link', () => {
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/analytics.readonly',
			],
		} );
		provideSiteInfo( registry, {
			proxySupportLinkURL: 'https://test.com',
			setupErrorCode: 'error_code',
			setupErrorMessage: 'An error occurred',
		} );
		const { container, getByRole } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( container ).toHaveTextContent( 'Get help' );
		expect( getByRole( 'link', { name: /get help/i } ) ).toHaveAttribute(
			'href',
			registry.select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: registry.select( CORE_SITE ).getSetupErrorCode(),
			} )
		);
	} );

	it( 'renders the GTE message when the only unsatisfied scope is the tagmanager readonly scope', async () => {
		act( () => {
			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );
			provideUserAuthentication( registry, {
				unsatisfiedScopes: [
					'https://www.googleapis.com/auth/tagmanager.readonly',
				],
			} );
			provideNotifications(
				registry,
				{
					'authentication-error':
						DEFAULT_NOTIFICATIONS[ 'authentication-error' ],
					'authentication-error-gte':
						DEFAULT_NOTIFICATIONS[ 'authentication-error-gte' ],
				},
				true
			);
		} );

		const { container, waitForRegistry } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await act( async () => {
			await waitForRegistry();
		} );

		expect( container ).toHaveTextContent(
			'Site Kit needs additional permissions to detect updates to tags on your site'
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'does not render the GTE message if there are multiple unsatisfied scopes', async () => {
		act( () => {
			provideModules( registry, [
				{
					slug: 'analytics-4',
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
			provideNotifications(
				registry,
				{
					'authentication-error':
						DEFAULT_NOTIFICATIONS[ 'authentication-error' ],
					'authentication-error-gte':
						DEFAULT_NOTIFICATIONS[ 'authentication-error-gte' ],
				},
				true
			);
		} );

		const { container, waitForRegistry } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await act( async () => {
			await waitForRegistry();
		} );

		expect( container ).toHaveTextContent(
			'Site Kit can’t access necessary data'
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'does not render the GTE message if the GTE feature is not enabled', () => {
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/tagmanager.readonly',
			],
		} );

		const { container } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( container ).toMatchSnapshot();
	} );

	it( 'does render the redo setup CTA if initial Site Kit setup authentication is not granted', () => {
		provideUserAuthentication( registry, {
			authenticated: false,
		} );
		provideSiteInfo( registry, {
			setupErrorRedoURL: '#',
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
		} );

		const { container } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( container ).toHaveTextContent( 'Setup was interrupted' );
		expect( container ).toHaveTextContent( 'Redo the plugin setup' );
	} );

	it( 'does not render the redo setup CTA if it is not due to the interruption of plugin setup and no permission is temporarily persisted', () => {
		provideUserAuthentication( registry );
		provideSiteInfo( registry, {
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
			setupErrorRedoURL: '#',
		} );

		const { container } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( container ).toHaveTextContent( 'Setup was interrupted' );
		expect( container ).not.toHaveTextContent( 'Redo the plugin setup' );
	} );

	it( 'does render the grant permission CTA if additional permissions were not granted and permission is temporarily persisted', () => {
		provideUserAuthentication( registry );
		provideSiteInfo( registry, {
			isAuthenticated: true,
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
			setupErrorRedoURL: '#',
		} );

		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_TEMPORARY_PERSIST_PERMISSION_ERROR, {
				status: 403,
				message: 'Generic scope',
				data: {
					scopes: [
						'https://www.googleapis.com/auth/analytics.edit',
					],
				},
			} );

		const { container } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( container ).toHaveTextContent( 'Setup was interrupted' );
		expect( container ).not.toHaveTextContent( 'Grant permission' );
	} );
} );
