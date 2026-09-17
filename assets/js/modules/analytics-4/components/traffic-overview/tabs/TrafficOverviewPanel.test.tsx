/**
 * Traffic Overview panel tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	getGraphReportArgs,
	getTotalsReportArgs,
} from '@/js/modules/analytics-4/components/dashboard/DashboardAllTrafficWidgetGA4/reportOptions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { createTestRegistry, render, waitFor } from '@tests/js/test-utils';
import { provideModules, provideSiteInfo } from '@tests/js/utils';
import TrafficOverviewPanel from './TrafficOverviewPanel';

describe( 'TrafficOverviewPanel', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	/**
	 * Puts a totals report in the store under the arguments the panel requests.
	 *
	 * @since 1.188.0
	 *
	 * @param {number} currentValue  Visitors over the selected range.
	 * @param {number} previousValue Visitors over the range before it.
	 * @param {string} [url]         Optional. The entity URL the report covers.
	 * @return {void}
	 */
	function provideTotalsReport(
		currentValue: number,
		previousValue: number,
		url?: string
	) {
		const { startDate, endDate, compareStartDate, compareEndDate } =
			registry.select( CORE_USER ).getDateRangeDates( { compare: true } );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				totals: [
					{ metricValues: [ { value: String( currentValue ) } ] },
					{ metricValues: [ { value: String( previousValue ) } ] },
				],
			},
			{
				options: getTotalsReportArgs( {
					startDate,
					endDate,
					compareStartDate,
					compareEndDate,
					...( url ? { url } : {} ),
				} ),
			}
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
	} );

	it( 'marks the panel as a tab panel and names it using the content in the "Traffic overview" tab', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		const panel = container.querySelector(
			'.googlesitekit-traffic-overview__panel'
		);

		expect( panel ).toHaveAttribute( 'role', 'tabpanel' );
		expect( panel ).toHaveAttribute(
			'aria-labelledby',
			'googlesitekit-traffic-overview-tab'
		);
	} );

	it( 'renders the visitor total, the traffic chart, and the traffic breakdown in that order', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		const sections = Array.from(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__panel > *'
			)
		);

		expect( sections.map( ( section ) => section.className ) ).toEqual( [
			'googlesitekit-traffic-overview__total-visitors',
			'googlesitekit-traffic-overview__chart',
			'googlesitekit-traffic-overview__breakdown',
		] );
	} );

	it( 'builds the visitor total and its badge from the totals report', async () => {
		provideTotalsReport( 1200, 1000 );

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( '1.2K' ) ).toBeInTheDocument();
		expect( getByText( '+20%' ) ).toBeInTheDocument();
	} );

	it( 'builds the visitor total and its badge from the entity-scoped totals report', async () => {
		const entityURL = 'https://example.com/about/';

		provideSiteInfo( registry, { currentEntityURL: entityURL } );
		// Only the entity-scoped report is in the store, so these values can
		// only come from the request that has the URL.
		provideTotalsReport( 500, 400, entityURL );

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( '500' ) ).toBeInTheDocument();
		expect( getByText( '+25%' ) ).toBeInTheDocument();
	} );

	it( "shows each day's visitors in the chart", async () => {
		// `provideAnalytics4MockReport` builds the same numbers for the same
		// options, so the report for `2025-01-09` to `2025-02-05` always opens
		// with 55 and 14 visitors.
		provideAnalytics4MockReport(
			registry,
			getGraphReportArgs( {
				startDate: '2025-01-09',
				endDate: '2025-02-05',
			} )
		);

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Google Charts draws nothing under Jest, so this test reads the
		// chart's screen-reader lines instead.
		expect(
			getByText( 'January 9, 2025: 55 visitors' )
		).toBeInTheDocument();
		expect(
			getByText( 'January 10, 2025: 14 visitors' )
		).toBeInTheDocument();
	} );

	it( "shows each day's visitors to the current URL in the chart on the entity dashboard", async () => {
		const entityURL = 'https://example.com/about/';

		provideSiteInfo( registry, { currentEntityURL: entityURL } );
		// The store has only the report for `entityURL`, so the 69 visitors on
		// `2025-01-09` can come from no other report.
		provideAnalytics4MockReport(
			registry,
			getGraphReportArgs( {
				startDate: '2025-01-09',
				endDate: '2025-02-05',
				url: entityURL,
			} )
		);

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText( 'January 9, 2025: 69 visitors' )
		).toBeInTheDocument();
	} );

	it( 'sends a report request when the panel renders', async () => {
		const { waitForRegistry } = render( <TrafficOverviewPanel />, {
			registry,
		} );

		await waitForRegistry();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( reportEndpoint )
		);
	} );
} );
