/**
 * TopTrafficSourceDrivingLeadsWidget component tests.
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
import {
	CORE_USER,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
} from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '@/js/util/errors';
import { render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '@tests/js/utils';
import TopTrafficSourceDrivingLeadsWidget from './TopTrafficSourceDrivingLeadsWidget';

describe( 'TopTrafficSourceDrivingLeadsWidget', () => {
	let registry: WPDataRegistry;

	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);
	const detectedEvent = ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM;

	function getReportOptions() {
		return {
			...registry.select( CORE_USER ).getDateRangeDates(),
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ detectedEvent ],
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: 6,
			keepEmptyRows: false,
			reportID: 'analytics-4_goal-driver-reports_top-traffic-channels',
		};
	}

	function getTotalReportOptions() {
		return {
			...registry.select( CORE_USER ).getDateRangeDates(),
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ detectedEvent ],
				},
			},
			metrics: [ { name: 'eventCount' } ],
			reportID:
				'analytics-4_goal-driver-reports_top-traffic-channels-total',
		};
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideKeyMetrics( registry );
		provideModules(
			registry,
			withConnected( MODULE_SLUG_ANALYTICS_4 ) as Parameters<
				typeof provideModules
			>[ 1 ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ detectedEvent ] );
	} );

	it( 'should render the loading state while resolving the report', async () => {
		// Two reports: the ranked channels and the site-wide total.
		freezeFetch( reportEndpoint, { repeat: 2 } );

		const { container, waitForRegistry } = render(
			<TopTrafficSourceDrivingLeadsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		[
			'.googlesitekit-km-widget-tile__loading',
			'.googlesitekit-km-widget-tile__loading-header',
			'.googlesitekit-km-widget-tile__loading-body',
		].forEach( ( selector ) => {
			expect( container.querySelector( selector ) ).toBeInTheDocument();
		} );
	} );

	it( 'should render the generic error variant when the report fetch fails', async () => {
		provideModuleRegistrations( registry );

		fetchMock.get( reportEndpoint, {
			body: {
				code: ERROR_INTERNAL_SERVER_ERROR,
				message: 'Internal server error',
				data: { reason: ERROR_INTERNAL_SERVER_ERROR },
			},
			status: 500,
		} );

		const { container, getByText, waitForRegistry } = render(
			<TopTrafficSourceDrivingLeadsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();
	} );

	it( 'should render the insufficient permissions error variant when the report fetch fails', async () => {
		fetchMock.get( reportEndpoint, {
			body: {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			},
			status: 500,
		} );

		const { container, getByText, waitForRegistry } = render(
			<TopTrafficSourceDrivingLeadsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Insufficient permissions/i ) ).toBeInTheDocument();
	} );

	it( 'should render the zero data state when the report has no rows', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: getReportOptions() } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: getTotalReportOptions() } );

		const { container, getByText, waitForRegistry } = render(
			<TopTrafficSourceDrivingLeadsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-table__body-row--no-data' )
		).toBeInTheDocument();
		expect(
			getByText(
				/No data to display: your site hasn’t received any visitors yet/i
			)
		).toBeInTheDocument();
	} );

	it( "should render each channel's share of the site-wide total as a percentage", async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [ { value: 'Organic Search' } ],
						metricValues: [ { value: '100' } ],
					},
					{
						dimensionValues: [ { value: 'Direct' } ],
						metricValues: [ { value: '60' } ],
					},
					{
						dimensionValues: [ { value: 'Referral' } ],
						metricValues: [ { value: '40' } ],
					},
				],
			},
			{ options: getReportOptions() }
		);
		// The ranked rows sum to 200, so dividing by this 400 rather than by
		// that sum is what these percentages prove.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ rows: [ { metricValues: [ { value: '400' } ] } ] },
				{ options: getTotalReportOptions() }
			);

		const { getByText, waitForRegistry } = render(
			<TopTrafficSourceDrivingLeadsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Organic Search' ) ).toBeInTheDocument();
		expect( getByText( '25%' ) ).toBeInTheDocument();
		expect( getByText( 'Direct' ) ).toBeInTheDocument();
		expect( getByText( '15%' ) ).toBeInTheDocument();
		expect( getByText( 'Referral' ) ).toBeInTheDocument();
		expect( getByText( '10%' ) ).toBeInTheDocument();
	} );

	it( 'should render the zero data state when the site has no lead events', async () => {
		// A tile with no lead event has nothing to request, so it must settle
		// on the zero data state rather than spin in the loading skeleton.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const { container, waitForRegistry } = render(
			<TopTrafficSourceDrivingLeadsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__loading' )
		).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-table__body-row--no-data' )
		).toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should show only the top three of the six rows it fetches', async () => {
		const sixRows = {
			rows: [ 'One', 'Two', 'Three', 'Four', 'Five', 'Six' ].map(
				( label, index ) => ( {
					dimensionValues: [ { value: label } ],
					metricValues: [ { value: String( 60 - index * 10 ) } ],
				} )
			),
		};
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( sixRows, { options: getReportOptions() } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ rows: [ { metricValues: [ { value: '600' } ] } ] },
				{ options: getTotalReportOptions() }
			);

		const { getByText, queryByText, waitForRegistry } = render(
			<TopTrafficSourceDrivingLeadsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'One' ) ).toBeInTheDocument();
		expect( getByText( 'Three' ) ).toBeInTheDocument();
		expect( queryByText( 'Four' ) ).not.toBeInTheDocument();
		expect( getByText( '10%' ) ).toBeInTheDocument();
	} );

	it( 'should fall back to the ranked rows when the total report is empty', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [ { value: 'Organic Search' } ],
						metricValues: [ { value: '100' } ],
					},
					{
						dimensionValues: [ { value: 'Direct' } ],
						metricValues: [ { value: '60' } ],
					},
				],
			},
			{ options: getReportOptions() }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: getTotalReportOptions() } );

		const { getByText, waitForRegistry } = render(
			<TopTrafficSourceDrivingLeadsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// 100 and 60 of their own 160, rather than 0% each.
		expect( getByText( '62.5%' ) ).toBeInTheDocument();
		expect( getByText( '37.5%' ) ).toBeInTheDocument();
	} );
} );
