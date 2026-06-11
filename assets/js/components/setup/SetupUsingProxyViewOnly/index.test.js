/**
 * SetupUsingProxyViewOnly component tests.
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
import { SHARED_DASHBOARD_SPLASH_ITEM_KEY } from '@/js/components/setup/constants';
import { VIEW_CONTEXT_SPLASH } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { fireEvent, muteFetch, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	provideUserInfo,
} from '@tests/js/utils';
import SetupUsingProxyViewOnly from './index';

jest.mock(
	'@/js/components/notifications/LegacyNotifications',
	() => () => null
);

jest.mock( '@/js/components/notifications/Notifications', () => () => null );

describe( 'SetupUsingProxyViewOnly', () => {
	mockLocation();

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash';

		provideModules( registry );
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: false } );

		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/tracking' )
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismissed-items' )
		);
		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/core/user/data/dismissed-prompts'
			)
		);

		fetchMock.post(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{
				body: JSON.stringify( [ SHARED_DASHBOARD_SPLASH_ITEM_KEY ] ),
				status: 200,
			}
		);
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'navigates to base dashboard URL when no params are present', async () => {
		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyViewOnly />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Go to dashboard' } ) );
		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
		);
	} );

	it( 'preserves the panel query parameter when present', async () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&panel=email-reporting';

		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyViewOnly />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Go to dashboard' } ) );
		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&panel=email-reporting'
		);
	} );

	it( 'preserves the notification query parameter when present', async () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&notification=test_notice';

		const { getByRole, waitForRegistry } = render(
			<SetupUsingProxyViewOnly />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Go to dashboard' } ) );
		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&notification=test_notice'
		);
	} );

	it( 'renders legacy splash content when setupFlowRefreshPhase4 is disabled', () => {
		const { container, getByText, getByRole } = render(
			<SetupUsingProxyViewOnly />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
				features: [],
			}
		);

		expect(
			container.querySelector( '.googlesitekit-progress-indicator' )
		).toBeNull();

		expect(
			getByText( /to view stats from all shared Google services/ )
		).toBeInTheDocument();

		expect( getByRole( 'link', { name: /Learn more/i } ) ).toHaveAttribute(
			'href',
			registry
				.select( CORE_SITE )
				.getDocumentationLinkURL( 'dashboard-sharing' )
		);

		expect(
			container.querySelector( '.googlesitekit-layout--rounded' )
		).toBeInTheDocument();
	} );

	describe( 'with the `setupFlowRefreshPhase4` feature flag enabled', () => {
		it( 'renders phase4 splash content and progress indicator', async () => {
			const { container, getByText, getByRole, waitForRegistry } = render(
				<SetupUsingProxyViewOnly />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SPLASH,
					features: [ 'setupFlowRefreshPhase4' ],
				}
			);

			await waitForRegistry();

			expect(
				container.querySelector( '.googlesitekit-progress-indicator' )
			).toBeInTheDocument();

			expect(
				getByText(
					/how people find and use your site as well as how to improve and monetize your content/
				)
			).toBeInTheDocument();

			expect(
				getByText(
					/containing stats from these shared Google services/
				)
			).toBeInTheDocument();

			expect(
				getByRole( 'link', { name: /Learn more/i } )
			).toHaveAttribute(
				'href',
				registry
					.select( CORE_SITE )
					.getDocumentationLinkURL( 'dashboard-sharing' )
			);

			expect(
				container.querySelector( '.googlesitekit-layout--rounded' )
			).toBeNull();
		} );

		it( 'should allow exiting the setup', async () => {
			registry.dispatch( CORE_SITE ).receiveSiteInfo( {
				adminURL: 'http://example.com/wp-admin/',
			} );

			const { queryByText } = render( <SetupUsingProxyViewOnly />, {
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
				features: [ 'setupFlowRefreshPhase4' ],
			} );

			expect( queryByText( /Exit setup/ ) ).toBeInTheDocument();

			fireEvent.click( queryByText( /Exit setup/ ) );

			await waitFor( () => {
				expect( global.location.assign ).toHaveBeenCalled();
			} );

			expect( global.location.assign ).toHaveBeenCalledWith(
				'http://example.com/wp-admin'
			);
		} );
	} );
} );
