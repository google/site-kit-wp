/**
 * DashboardAllTrafficWidgetGA4 component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	provideModules,
} from '../../../../../../../tests/js/utils';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { render } from '../../../../../../../tests/js/test-utils';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import DashboardAllTrafficWidgetGA4 from '.';

describe( 'DashboardAllTrafficWidgetGA4', () => {
	let registry;

	const baseOptions = {
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		compareStartDate: '2020-11-11',
		compareEndDate: '2020-12-08',
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		reportID:
			'analytics-4_dashboard-all-traffic-widget-ga4_widget_totalsArgs',
	};

	const reportOptions = [
		{
			// Pie chart, with sessionDefaultChannelGrouping dimension.
			...baseOptions,
			dimensions: [ 'sessionDefaultChannelGrouping' ],
			orderby: [
				{
					metric: {
						metricName: 'totalUsers',
					},
					desc: true,
				},
			],
			reportID:
				'analytics-4_dashboard-all-traffic-widget-ga4_widget_pieArgs',
		},
		{
			// Pie chart, with country dimension.
			...baseOptions,
			dimensions: [ 'country' ],
			orderby: [
				{
					metric: {
						metricName: 'totalUsers',
					},
					desc: true,
				},
			],
			reportID:
				'analytics-4_dashboard-all-traffic-widget-ga4_widget_pieArgs',
		},
		{
			// Pie chart, with deviceCategory dimension.
			...baseOptions,
			dimensions: [ 'deviceCategory' ],
			orderby: [
				{
					metric: {
						metricName: 'totalUsers',
					},
					desc: true,
				},
			],
			limit: 6,
			reportID:
				'analytics-4_dashboard-all-traffic-widget-ga4_widget_pieArgs',
		},
		// Totals.
		baseOptions,
		{
			// Line chart.
			startDate: '2020-12-09',
			endDate: '2021-01-05',
			dimensions: [ 'date' ],
			metrics: [
				{
					name: 'totalUsers',
				},
			],
			reportID:
				'analytics-4_dashboard-all-traffic-widget-ga4_widget_graphArgs',
		},
		{
			// Line chart.
			startDate: '2020-12-09',
			endDate: '2021-01-05',
			dimensions: [ 'date' ],
			metrics: [
				{
					name: 'totalUsers',
				},
			],
			orderby: [
				{
					dimension: {
						dimensionName: 'date',
					},
				},
			],
			reportID:
				'analytics-4_dashboard-all-traffic-widget-ga4_widget_graphArgs',
		},
		{
			// Gathering data check.
			startDate: '2020-11-11',
			endDate: '2021-01-05',
			dimensions: [ 'date' ],
			metrics: [
				{
					name: 'totalUsers',
				},
			],
		},
	];

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsAllTrafficGA4'
	)( DashboardAllTrafficWidgetGA4 );

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-06' );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
	} );

	it( 'should render the widget', async () => {
		reportOptions.forEach( ( options ) => {
			provideAnalytics4MockReport( registry, options );
		} );

		const { container, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render an error state if there is a report error', async () => {
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};

		reportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, 'getReport', [ options ] );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		} );

		const { container, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Data error in Analytics' );
		expect( container ).toMatchSnapshot();
	} );
} );
