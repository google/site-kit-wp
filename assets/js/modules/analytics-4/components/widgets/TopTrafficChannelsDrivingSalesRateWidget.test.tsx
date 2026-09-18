/**
 * TopTrafficChannelsDrivingSalesRateWidget component tests.
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
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { render } from '@tests/js/test-utils';
import { createTestRegistry, freezeFetch } from '@tests/js/utils';
import TopTrafficChannelsDrivingSalesRateWidget from './TopTrafficChannelsDrivingSalesRateWidget';
import {
	SALES_WIDGET_REPORT_ENDPOINT,
	provideSalesWidgetTestRegistry,
	testGenericReportError,
	testInsufficientPermissionsError,
} from './utils/salesWidgetTestRegistry';

describe( 'TopTrafficChannelsDrivingSalesRateWidget', () => {
	let registry: WPDataRegistry;

	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE
	);

	function getReportOptions() {
		return {
			...registry.select( CORE_USER ).getDateRangeDates(),
			dimensions: [ 'sessionDefaultChannelGroup' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
				},
			},
			metrics: [ { name: 'eventCount' }, { name: 'sessions' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: 6,
			keepEmptyRows: false,
			reportID:
				'analytics-4_goal-driver-reports_top-traffic-channels-rate',
		};
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideSalesWidgetTestRegistry( registry );
	} );

	it( 'should render the loading state while resolving the report', async () => {
		// Freeze the report fetch to keep the widget in loading state.
		freezeFetch( SALES_WIDGET_REPORT_ENDPOINT );

		const { container, waitForRegistry } = render(
			<TopTrafficChannelsDrivingSalesRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__loading' )
		).toBeInTheDocument();
	} );

	testGenericReportError(
		() => registry,
		TopTrafficChannelsDrivingSalesRateWidget,
		widgetProps
	);

	testInsufficientPermissionsError(
		() => registry,
		TopTrafficChannelsDrivingSalesRateWidget,
		widgetProps
	);

	it( 'should render the zero data state when the report has no rows', async () => {
		const reportOptions = getReportOptions();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: reportOptions } );

		const { container, getByText, waitForRegistry } = render(
			<TopTrafficChannelsDrivingSalesRateWidget { ...widgetProps } />,
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

	it( "should render each channel's own conversion rate rather than a share of the total", async () => {
		const reportOptions = getReportOptions();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [ { value: 'Organic Search' } ],
						metricValues: [ { value: '40' }, { value: '100' } ],
					},
					{
						dimensionValues: [ { value: 'Paid Search' } ],
						metricValues: [ { value: '20' }, { value: '100' } ],
					},
					{
						dimensionValues: [ { value: 'Direct' } ],
						metricValues: [ { value: '10' }, { value: '200' } ],
					},
				],
			},
			{ options: reportOptions }
		);

		const { getByText, waitForRegistry } = render(
			<TopTrafficChannelsDrivingSalesRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Organic Search' ) ).toBeInTheDocument();
		expect( getByText( '40%' ) ).toBeInTheDocument();
		expect( getByText( 'Paid Search' ) ).toBeInTheDocument();
		expect( getByText( '20%' ) ).toBeInTheDocument();
		expect( getByText( 'Direct' ) ).toBeInTheDocument();
		// Direct's own rate (10/200 = 5%) is far lower than its share of the
		// total event count (10/70 ≈ 14%) would be, confirming the value is
		// each channel's own rate rather than a share of the total.
		expect( getByText( '5%' ) ).toBeInTheDocument();
	} );
} );
