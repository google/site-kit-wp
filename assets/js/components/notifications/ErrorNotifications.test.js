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
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

describe( 'ErrorNotifications', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
	} );

	it( 'does not render UnsatisfiedScopesAlert when user is not authenticated', () => {
		provideUserAuthentication( registry, {
			authenticated: false,
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/analytics.readonly',
			],
		} );
		const { container } = render( <ErrorNotifications />, {
			registry,
		} );
		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'renders UnsatisfiedScopesAlert when user is authenticated', () => {
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/analytics.readonly',
			],
		} );
		const { container } = render( <ErrorNotifications />, {
			registry,
		} );

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
		} );

		expect( container ).toHaveTextContent( 'Get help' );
		expect( getByRole( 'link', { name: /get help/i } ) ).toHaveAttribute(
			'href',
			registry.select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: registry.select( CORE_SITE ).getSetupErrorCode(),
			} )
		);
	} );

	it( 'renders the GTE message when the only unsatisfied scope is the tagmanager readonly scope', () => {
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

		const { container } = render( <ErrorNotifications />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Site Kit needs additional permissions to detect updates to tags on your site'
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'does not render the GTE message if there are multiple unsatisfied scopes', () => {
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/tagmanager.readonly',
				'https://www.googleapis.com/auth/analytics.readonly',
			],
		} );

		const { container } = render( <ErrorNotifications />, {
			registry,
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
		} );

		expect( container ).toHaveTextContent(
			'Site Kit can’t access necessary data'
		);
		expect( container ).toMatchSnapshot();
	} );
} );
