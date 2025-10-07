/**
 * LinkAnalyticsAndAdSenseAccountsOverlayNotification component tests.
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
import LinkAnalyticsAndAdSenseAccountsOverlayNotification, {
	LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION,
} from './LinkAnalyticsAndAdSenseAccountsOverlayNotification';
import {
	render,
	createTestRegistry,
	provideModules,
	fireEvent,
	act,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import Notifications from '@/js/components/notifications/Notifications';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';

describe( 'LinkAnalyticsAndAdSenseAccountsOverlayNotification', () => {
	const LinkAnalyticsAndAdSenseAccountsOverlayNotificationComponent =
		withNotificationComponentProps(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		)( LinkAnalyticsAndAdSenseAccountsOverlayNotification );

	const notification =
		DEFAULT_NOTIFICATIONS[ LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION ];

	let registry;

	const fetchGetDismissedItems = new RegExp(
		'/google-site-kit/v1/core/user/data/dismissed-items'
	);
	const fetchDismissItem = new RegExp(
		'/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ADSENSE,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: false,
		} );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION,
				notification
			);
	} );

	it( 'renders the overlay notification component correctly', () => {
		const { container } = render(
			<LinkAnalyticsAndAdSenseAccountsOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( container ).toHaveTextContent(
			'Link your Analytics and AdSense accounts to find out'
		);
	} );

	it( 'renders the overlay notification correctly on the main dashboard', async () => {
		const { container, waitForRegistry } = render(
			<Notifications
				areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
				groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Link your Analytics and AdSense accounts to find out'
		);
	} );

	it( 'does not render on the main view only dashboard', async () => {
		const { container, waitForRegistry } = render(
			<Notifications
				areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
				groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);
		await waitForRegistry();

		expect( container ).not.toHaveTextContent(
			'Link your Analytics and AdSense accounts to find out'
		);
	} );

	it( 'does not render on the entity dashboard', async () => {
		const { container, waitForRegistry } = render(
			<Notifications
				areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
				groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).not.toHaveTextContent(
			'Link your Analytics and AdSense accounts to find out'
		);
	} );

	it( 'renders `Learn how` and `Maybe later` buttons`', async () => {
		const supportURL = registry.select( CORE_SITE ).getGoogleSupportURL( {
			path: '/adsense/answer/6084409',
		} );

		const { container, getByRole, waitForRegistry } = render(
			<Notifications
				areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
				groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Learn how' );
		expect( getByRole( 'button', { name: /learn how/i } ) ).toHaveAttribute(
			'href',
			supportURL
		);
		expect( container ).toHaveTextContent( 'Maybe later' );
	} );

	it( 'clicking the `Learn how` button dismisses the notification', async () => {
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.postOnce( fetchDismissItem, {
			body: [ LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION ],
		} );

		const { container, getByRole, rerender, waitForRegistry } = render(
			<Notifications
				areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
				groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Link your Analytics and AdSense accounts to find out'
		);

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /learn how/i } ) );
		} );

		rerender();

		expect( container ).not.toHaveTextContent(
			'Link your Analytics and AdSense accounts to find out'
		);
	} );

	it( 'clicking the `Maybe later` button dismisses the notification', async () => {
		fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
		fetchMock.postOnce( fetchDismissItem, {
			body: [ LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION ],
		} );

		const { container, getByRole, rerender, waitForRegistry } = render(
			<Notifications
				areaSlug={ NOTIFICATION_AREAS.OVERLAYS }
				groupID={ NOTIFICATION_GROUPS.SETUP_CTAS }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Link your Analytics and AdSense accounts to find out'
		);

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /maybe later/i } ) );
		} );

		rerender();

		expect( container ).not.toHaveTextContent(
			'Link your Analytics and AdSense accounts to find out'
		);
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when all the conditions are met', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when the Analytics module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ADSENSE,
					active: true,
					connected: true,
				},
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: false,
				},
			] );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the AdSense module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ADSENSE,
					active: true,
					connected: false,
				},
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when adSenseLinked is `true`', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( true );
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );
	} );
} );
