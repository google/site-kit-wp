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
	muteFetch,
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
import { mockLocation } from 'tests/js/mock-browser-utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';

const CONNECT_MORE_SERVICES_NOTIFICATION_SLUG =
	'connect-more-services-notification';

describe( 'ConnectMoreServicesNotification', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	mockLocation();

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
	} );

	describe( 'component behaviour', () => {
		beforeEach( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsDataAvailableOnLoad( true );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveIsDataAvailableOnLoad( true );
		} );

		it( 'should render correctly', () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
				[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
			} );

			const { container, getByRole, getByText } = render(
				<ConnectMoreServicesNotificationComponent />,
				{ registry }
			);

			expect( container ).toMatchSnapshot();

			expect(
				getByText(
					'Boost your site’s performance by enhancing your dashboard'
				)
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: 'Connect more services' } )
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: 'Maybe later' } )
			).toBeInTheDocument();
		} );

		it( 'should show a tooltip when the "Maybe later" button is clicked', () => {
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

			const { getByRole } = render(
				<ConnectMoreServicesNotificationComponent />,
				{ registry }
			);

			fireEvent.click( getByRole( 'button', { name: 'Maybe later' } ) );

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

		it( 'should redirect to the "connect more services" URL when the "Connect more services" button is clicked and dismiss the notification', () => {
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

			provideSiteInfo( registry, {
				connectMoreServicesURL: 'https://example.com/connect',
			} );

			const { getByRole } = render(
				<ConnectMoreServicesNotificationComponent />,
				{ registry }
			);

			fireEvent.click(
				getByRole( 'button', { name: 'Connect more services' } )
			);

			expect( global.location.assign ).toHaveBeenCalledWith(
				'http://example.com/wp-admin/admin.php?page=googlesitekit-settings#connect-more-services'
			);
		} );
	} );

	describe( 'checkRequirements', () => {
		beforeEach( () => {
			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/data-available'
				)
			);
			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/search-console/data/data-available'
				)
			);
		} );

		it( 'is active when the Search Console and Analytics modules are not in the gathering data state and the user is authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
				[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
			} );
			provideUserAuthentication( registry );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when the Search console module is not in the gathering data state and the Analytics module is in the gathering data state and the user is authenticated', async () => {
			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			provideGatheringDataState( registry, {
				[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
			} );
			provideUserAuthentication( registry );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the Search Console module is not in the gathering data state and the Analytics module is in the gathering data state and the user is not authenticated', async () => {
			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			provideGatheringDataState( registry, {
				[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
			} );
			provideUserAuthentication( registry, { authenticated: false } );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the Search Console module is in the gathering data state and the Analytics module is not in the gathering data state and the user is authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
			} );
			provideUserAuthentication( registry );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the Search Console and Analytics modules are not in the gathering data state and the user is not authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
			} );

			provideUserAuthentication( registry, { authenticated: false } );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the Search Console module is in the gathering data state and the Analytics module is not in the gathering data state and the user is not authenticated', async () => {
			provideGatheringDataState( registry, {
				[ MODULE_SLUG_ANALYTICS_4 ]: false,
				[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
			} );

			provideUserAuthentication( registry, { authenticated: false } );

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );
	} );
} );
