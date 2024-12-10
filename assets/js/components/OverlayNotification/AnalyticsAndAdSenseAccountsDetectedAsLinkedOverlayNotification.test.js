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
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../.storybook/utils/zeroReports';
import {
	act,
	createTestRegistry,
	fireEvent,
	freezeFetch,
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
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../modules/analytics-4/utils/data-mock';
import AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification, {
	ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION,
} from './AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';

describe( 'AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification', () => {
	let registry;

	const adSenseAccountID = 'pub-1234567890';

	const fetchGetDismissedItemsRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);
	const fetchDismissItemRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const fetchAnalyticsReportRegExp = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
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
				slug: 'adsense',
				active: true,
				connected: true,
				shareable: true,
			},
			{
				slug: 'analytics-4',
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

	it( 'does not render when Analytics module is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'adsense',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render when AdSense module is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'adsense',
				active: true,
				connected: false,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render when isAdSenseLinked is `false`', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( false );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render if dismissed previously', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION,
			] );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render if it was dismissed by the `dismissItem` action', async () => {
		fetchMock.getOnce( fetchGetDismissedItemsRegExp, { body: [] } );
		fetchMock.postOnce( fetchDismissItemRegExp, {
			body: [ ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION ],
		} );

		// Dismissing the notification should cause it to not render.
		await registry
			.dispatch( CORE_UI )
			.dismissOverlayNotification(
				ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION
			);

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render if another notification is showing', async () => {
		freezeFetch( fetchAnalyticsReportRegExp );

		await registry
			.dispatch( CORE_UI )
			.setOverlayNotificationToShow( 'TestOverlayNotification' );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render without the feature flag', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION,
			] );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render if adSenseLinked is `true` but data is in a "gathering data" state', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: reportOptions } );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render if adSenseLinked is `true` but there is zero data', async () => {
		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( zeroReport, { options: reportOptions } );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'renders if adSenseLinked is `true` and data is available', async () => {
		provideAnalytics4MockReport( registry, reportOptions );

		const { container, waitForRegistry } = render(
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
	} );

	it( 'does not render in entity dashboard', async () => {
		provideAnalytics4MockReport( registry, reportOptions );

		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
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

	it( 'does not render in "view only" dashboard without Analytics access', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		registry
			.dispatch( CORE_USER )
			.receiveGetCapabilities(
				capabilitiesAnalyticsNoAccess.permissions
			);
		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
	} );

	it( 'does not render in "view only" dashboard without AdSense access', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		registry
			.dispatch( CORE_USER )
			.receiveGetCapabilities( capabilitiesAdSenseNoAccess.permissions );
		const { container, waitForRegistry } = render(
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);
		await waitForRegistry();
		expect( container ).not.toHaveTextContent(
			'Data is now available for the pages that earn the most AdSense revenue'
		);
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
