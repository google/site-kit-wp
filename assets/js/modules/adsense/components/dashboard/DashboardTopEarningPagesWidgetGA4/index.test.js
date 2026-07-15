/**
 * DashboardTopEarningPagesWidgetGA4 tests.
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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	STRATEGY_ZIP,
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '@/js/modules/analytics-4/utils/data-mock';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	render,
} from '@tests/js/test-utils';
import DashboardTopEarningPagesWidgetGA4 from '.';

const adSenseAccountID = 'pub-1234567890';

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'pagePath', 'adSourceName' ],
	metrics: [ { name: 'totalAdRevenue' } ],
	dimensionFilters: {
		adSourceName: `Google AdSense account (${ adSenseAccountID })`,
	},
	orderby: [ { metric: { metricName: 'totalAdRevenue' }, desc: true } ],
	limit: 5,
	reportID: 'adsense_top-earning-pages-widget-ga4_widget_args',
};

const pageTitlesReportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensionFilters: {
		pagePath: new Array( 5 )
			.fill( '' )
			.map( ( _, index ) => `/test-post-${ index + 1 }/` )
			.sort(),
	},
	dimensions: [ 'pagePath', 'pageTitle' ],
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
	limit: 25,
	reportID: 'analytics-4_get-page-titles_store:selector_options',
};

const WidgetWithComponentProps = withWidgetComponentProps(
	'adsenseTopEarningPagesGA4'
)( DashboardTopEarningPagesWidgetGA4 );

describe( 'DashboardTopEarningPagesWidgetGA4', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-07' );
		provideModules(
			registry,
			withConnected( MODULE_SLUG_ANALYTICS_4, MODULE_SLUG_ADSENSE )
		);
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ADSENSE ).setAccountID( adSenseAccountID );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		// The widget reads these on every render; seed them so their resolvers
		// don't fetch.
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );
	} );

	function provideReports() {
		const pageTitlesReport = getAnalytics4MockResponse(
			pageTitlesReportOptions,
			// Zip the dimensions so each page path maps one-to-one to a title.
			{ dimensionCombinationStrategy: STRATEGY_ZIP }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageTitlesReport, {
				options: pageTitlesReportOptions,
			} );
		provideAnalytics4MockReport( registry, reportOptions );
	}

	// Resolves the main report to an empty result so the widget stops loading
	// and reaches its AdSense-link branch.
	function provideEmptyReport() {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: reportOptions } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ reportOptions ] );
	}

	it( 'renders the Top Earning Pages and Earnings columns on the admin dashboard', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( true );
		provideReports();

		const { findByText, queryByText } = render(
			<WidgetWithComponentProps />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		expect( await findByText( 'Top Earning Pages' ) ).toBeInTheDocument();
		expect( await findByText( 'Earnings' ) ).toBeInTheDocument();
		// The AdSense link CTA is not shown when AdSense is linked.
		expect(
			queryByText( 'Link Analytics and AdSense' )
		).not.toBeInTheDocument();
	} );

	it( 'renders the table on the view-only dashboard', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( true );
		provideReports();

		const { findByText } = render( <WidgetWithComponentProps />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( await findByText( 'Top Earning Pages' ) ).toBeInTheDocument();
		expect( await findByText( 'Earnings' ) ).toBeInTheDocument();
	} );

	it( 'renders the AdSense link CTA on the admin dashboard when AdSense is not linked', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( false );
		provideEmptyReport();

		const { findByText, queryByText } = render(
			<WidgetWithComponentProps />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		expect(
			await findByText( 'Link Analytics and AdSense' )
		).toBeInTheDocument();
		// The table is not rendered while AdSense is unlinked.
		expect( queryByText( 'Top Earning Pages' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing on the view-only dashboard when AdSense is not linked', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAdSenseLinked( false );
		provideEmptyReport();

		const { container, queryByText, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);
		await waitForRegistry();

		// `WidgetNull` renders no table and no CTA on a view-only dashboard.
		expect( queryByText( 'Top Earning Pages' ) ).not.toBeInTheDocument();
		expect(
			queryByText( 'Link Analytics and AdSense' )
		).not.toBeInTheDocument();
		expect( container ).toBeEmptyDOMElement();
	} );
} );
