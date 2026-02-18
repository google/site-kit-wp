/**
 * ConnectMoreServicesNotification component tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	render,
	provideGatheringDataState,
	provideUserAuthentication,
	fireEvent,
	provideSiteInfo,
} from '../../../../tests/js/test-utils';
import { dismissItemEndpoint } from 'tests/js/mock-dismiss-item-endpoints';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import ConnectMoreServicesNotification from './ConnectMoreServicesNotification';

const CONNECT_MORE_SERVICES_NOTIFICATION_SLUG =
	'connect-more-services-notification';

describe( 'ConnectMoreServicesNotification', () => {
	let registry;

	const ConnectMoreServicesNotificationComponent =
		withNotificationComponentProps(
			CONNECT_MORE_SERVICES_NOTIFICATION_SLUG
		)( ConnectMoreServicesNotification );

	const notification =
		DEFAULT_NOTIFICATIONS[ CONNECT_MORE_SERVICES_NOTIFICATION_SLUG ];

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				CONNECT_MORE_SERVICES_NOTIFICATION_SLUG,
				notification
			);

		// Stub data-available for modules to prevent unmatched POST warnings/errors.
		fetchMock.reset();
		fetchMock.post(
			/\/google-site-kit\/v1\/modules\/analytics-4\/data\/data-available\?_locale=user/,
			{ body: { dataAvailable: true } }
		);
		fetchMock.post(
			/\/google-site-kit\/v1\/modules\/search-console\/data\/data-available\?_locale=user/,
			{ body: { dataAvailable: true } }
		);
	} );

	it( 'should render correctly', async () => {
		// Provide that neither module is gathering data.
		provideGatheringDataState( registry, {
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		const { container, getByRole, getByText, waitForRegistry } = render(
			<ConnectMoreServicesNotificationComponent />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				"Boost your site's performance by enhancing your dashboard"
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Connect more services' } )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Maybe later' } )
		).toBeInTheDocument();
	} );

	it( 'should show a tooltip when the "Maybe later" button is clicked', async () => {
		provideGatheringDataState( registry, {
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: {
				[ CONNECT_MORE_SERVICES_NOTIFICATION_SLUG ]: {
					expires: 0,
					count: 1,
				},
			},
		} );

		const { getByRole, waitForRegistry } = render(
			<ConnectMoreServicesNotificationComponent />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Maybe later' } ) );

		await waitForRegistry();

		const tooltip = registry
			.select( CORE_UI )
			.getValue( 'admin-screen-tooltip' );

		expect( tooltip ).toEqual( {
			isTooltipVisible: true,
			tooltipSlug: CONNECT_MORE_SERVICES_NOTIFICATION_SLUG,
			title: 'You can always set up additional services from Settings later',
			dismissLabel: 'Got it',
		} );
	} );

	it( 'Should redirect to connect more services url and notification is dismissed when "Connect more services" button is clicked.', async () => {
		provideGatheringDataState( registry, {
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: {
				[ CONNECT_MORE_SERVICES_NOTIFICATION_SLUG ]: {
					expires: 0,
					count: 1,
				},
			},
		} );

		// Provide a connect-more-services URL.
		provideSiteInfo( registry, {
			connectMoreServicesURL: 'https://example.com/connect',
		} );

		const { getByRole, waitForRegistry } = render(
			<ConnectMoreServicesNotificationComponent />,
			{ registry }
		);

		// Mock location.assign to avoid jsdom navigation errors and assert redirect.
		delete window.location;
		window.location = { assign: jest.fn() };

		fireEvent.click(
			getByRole( 'button', { name: 'Connect more services' } )
		);

		await waitForRegistry();

		// Verify navigation started to the settings URL for connecting more services.
		expect( window.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-settings#connect-more-services'
		);
	} );

	describe( 'checkRequirements', () => {
		it( 'Is active when Analytics and Search console modules are not in gather data state and user is authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
				[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
			} );
			provideUserAuthentication( registry );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( true );
		} );

		it( 'Is not active when Search console module is in gathering data state and Analytics module is not in gathering data state and user is authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
				[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
			} );
			provideUserAuthentication( registry );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'Is not active when Search console module is in gathering data state (regardless of Analytics) and user is authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
				[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
			} );
			provideUserAuthentication( registry );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'Is not active when Analytics and search console modules are not in gathering data state and user is not authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
				[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
			} );
			// Mark user unauthenticated.
			provideUserAuthentication( registry, { authenticated: false } );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'Is not active when Search console module is in gathering data state and user is not authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
				[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
			} );
			// Mark user unauthenticated.
			provideUserAuthentication( registry, { authenticated: false } );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );
	} );
} );
