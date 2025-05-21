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
	muteFetch,
} from '../../../../tests/js/test-utils';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '../../modules/tagmanager/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

describe( 'ErrorNotifications', () => {
	let registry;

	const permissionsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/permissions'
	);

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const searchAnalyticsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		muteFetch( permissionsEndpoint );
		muteFetch( reportEndpoint );
		muteFetch( searchAnalyticsEndpoint );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
	} );

	it( 'does not render UnsatisfiedScopesAlert when user is not authenticated', async () => {
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
		provideNotifications( registry );

		const { container, waitForRegistry } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
		await waitForRegistry();

		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'renders UnsatisfiedScopesAlert when user is authenticated', async () => {
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
		provideNotifications( registry );

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

	it( 'renders `Get help` link', async () => {
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
		provideNotifications( registry );
		const { container, getByRole, waitForRegistry } = render(
			<ErrorNotifications />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Get help' );
		expect( getByRole( 'link', { name: /get help/i } ) ).toHaveAttribute(
			'href',
			registry.select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: registry.select( CORE_SITE ).getSetupErrorCode(),
			} )
		);
	} );

	it( 'renders the GTE message when the only unsatisfied scope is the tagmanager readonly scope', async () => {
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
		provideNotifications( registry );

		const { container, waitForRegistry } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Site Kit needs additional permissions to detect updates to tags on your site'
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'does not render the GTE message if there are multiple unsatisfied scopes', async () => {
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
		provideNotifications( registry );

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

	it( 'does render the redo setup CTA if initial Site Kit setup authentication is not granted', async () => {
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
			authenticated: false,
		} );
		provideNotifications( registry );
		provideSiteInfo( registry, {
			setupErrorRedoURL: '#',
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
		} );

		const { container, waitForRegistry } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Setup was interrupted' );
		expect( container ).toHaveTextContent( 'Redo the plugin setup' );
	} );

	it( 'does not render the redo setup CTA if it is not due to the interruption of plugin setup and no permission is temporarily persisted', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		provideUserAuthentication( registry );
		provideNotifications( registry );
		provideSiteInfo( registry, {
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
			setupErrorRedoURL: '#',
		} );

		const { container, waitForRegistry } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Setup was interrupted' );
		expect( container ).not.toHaveTextContent( 'Redo the plugin setup' );
	} );

	it( 'does render the grant permission CTA if additional permissions were not granted and permission is temporarily persisted', async () => {
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
		provideNotifications( registry );

		const { container, waitForRegistry } = render( <ErrorNotifications />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );
		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Setup was interrupted' );
		expect( container ).not.toHaveTextContent( 'Grant permission' );
	} );
} );
