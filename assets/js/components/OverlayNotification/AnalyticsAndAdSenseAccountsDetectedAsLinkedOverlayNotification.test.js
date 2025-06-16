/**
 * AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification component tests.
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
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../tests/js/utils/zeroReports';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideUserAuthentication,
	render,
} from '../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../googlesitekit/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
import { MODULE_SLUG_ADSENSE } from '../../modules/adsense/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../modules/analytics-4/constants';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../modules/analytics-4/utils/data-mock';
import AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification, {
	ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION,
} from './AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '../../googlesitekit/notifications/constants';
import Notifications from '../notifications/Notifications';

describe( 'AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification', () => {
	const AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotificationComponent =
		withNotificationComponentProps(
			ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION
		)( AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification );

	const notification =
		DEFAULT_NOTIFICATIONS[ ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION ];

	let registry;

	const adSenseAccountID = 'pub-1234567890';

	const fetchGetDismissedItemsRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);
	const fetchDismissItemRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const capabilitiesAdSenseNoAccess = {
		permissions: {
			'googlesitekit_read_shared_module_data::["adsense"]': false,
			'googlesitekit_manage_module_sharing_options::["analytics-4"]': true,
		},
	};

	const capabilitiesAnalyticsNoAccess = {
		permissions: {
			'googlesitekit_read_shared_module_data::["analytics-4"]': false,
			'googlesitekit_manage_module_sharing_options::["adsense"]': true,
		},
	};

	const capabilities = {
		permissions: {
			'googlesitekit_read_shared_module_data::["analytics-4"]': true,
			'googlesitekit_read_shared_module_data::["adsense"]': true,
		},
	};
	let reportOptions;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ADSENSE,
				active: true,
				connected: true,
				shareable: true,
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			adSenseLinked: true,
		} );
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			accountID: adSenseAccountID,
		} );
		const dateRangeDates = registry
			.select( CORE_USER )
			.getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } );
		reportOptions = {
			...dateRangeDates,
			dimensions: [ 'pagePath', 'adSourceName' ],
			metrics: [ { name: 'totalAdRevenue' } ],
			dimensionFilters: {
				adSourceName: `Google AdSense account (${ adSenseAccountID })`,
			},
			orderby: [
				{ metric: { metricName: 'totalAdRevenue' }, desc: true },
			],
			limit: 1,
		};
	} );

	it( 'renders the overlay notification component correctly.', () => {
		const { container } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( container ).toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render on the entity dashboard', async () => {
		provideAnalytics4MockReport( registry, reportOptions );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

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
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when all the conditions are met', async () => {
			provideAnalytics4MockReport( registry, reportOptions );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when the Analytics module is not connected', async () => {
			provideAnalytics4MockReport( registry, reportOptions );

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
			provideAnalytics4MockReport( registry, reportOptions );

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

		it( 'does not render when isAdSenseLinked is `false`', async () => {
			provideAnalytics4MockReport( registry, reportOptions );

			registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( false );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active if adSenseLinked is `true` but data is in a "gathering data" state', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options: reportOptions } );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when adSenseLinked is `true` but there is zero data', async () => {
			const report = getAnalytics4MockResponse( reportOptions );
			const zeroReport =
				replaceValuesInAnalytics4ReportWithZeroData( report );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( zeroReport, { options: reportOptions } );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active on a "view only" dashboard without Analytics access', async () => {
			provideAnalytics4MockReport( registry, reportOptions );

			expect(
				await notification.checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( true );

			provideUserAuthentication( registry, { authenticated: false } );
			registry
				.dispatch( CORE_USER )
				.receiveGetCapabilities(
					capabilitiesAnalyticsNoAccess.permissions
				);

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when on a "view only" dashboard without AdSense access', async () => {
			provideAnalytics4MockReport( registry, reportOptions );

			expect(
				await notification.checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( true );

			provideUserAuthentication( registry, { authenticated: false } );
			registry
				.dispatch( CORE_USER )
				.receiveGetCapabilities(
					capabilitiesAdSenseNoAccess.permissions
				);

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is active on a "view only" dashboard with Analytics and AdSense access', async () => {
			provideAnalytics4MockReport( registry, reportOptions );

			expect(
				await notification.checkRequirements(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( true );

			provideUserAuthentication( registry, { authenticated: false } );
			registry
				.dispatch( CORE_USER )
				.receiveGetCapabilities( capabilities.permissions );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
			);
			expect( isActive ).toBe( true );
		} );
	} );

	it( 'renders in "view only" dashboard with Analytics and AdSense access', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		registry
			.dispatch( CORE_USER )
			.receiveGetCapabilities( capabilities.permissions );
		provideAnalytics4MockReport( registry, reportOptions );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);
		await waitForRegistry();
		expect( container ).toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render in "view only" entity dashboard', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		registry
			.dispatch( CORE_USER )
			.receiveGetCapabilities( capabilities.permissions );
		provideAnalytics4MockReport( registry, reportOptions );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'renders `Show me` and `Maybe later` buttons`', async () => {
		provideAnalytics4MockReport( registry, reportOptions );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Show me' );
		expect( container ).toHaveTextContent( 'Maybe later' );
	} );

	it( 'clicking the `Show me` button dismisses the notification', async () => {
		provideAnalytics4MockReport( registry, reportOptions );
		fetchMock.getOnce( fetchGetDismissedItemsRegExp, { body: [] } );
		fetchMock.postOnce( fetchDismissItemRegExp, {
			body: [ ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION ],
		} );

		const { container, getByRole, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /show me/i } ) );
		} );

		await waitForRegistry();

		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'clicking the `Maybe later` button dismisses the notification', async () => {
		provideAnalytics4MockReport( registry, reportOptions );
		fetchMock.getOnce( fetchGetDismissedItemsRegExp, { body: [] } );
		fetchMock.postOnce( fetchDismissItemRegExp, {
			body: [ ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION ],
		} );

		const { container, getByRole, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);

		await act( async () => {
			await fireEvent.click(
				getByRole( 'button', { name: /maybe later/i } )
			);
		} );

		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );
} );
