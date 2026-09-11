/**
 * SalesByVisitorTypeWidget component tests.
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
	KM_ANALYTICS_SALES_BY_VISITOR_TYPE,
} from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { render } from '@tests/js/test-utils';
import { createTestRegistry, freezeFetch } from '@tests/js/utils';
import SalesByVisitorTypeWidget from './SalesByVisitorTypeWidget';
import {
	SALES_WIDGET_REPORT_ENDPOINT,
	provideSalesWidgetTestRegistry,
	testGenericReportError,
	testInsufficientPermissionsError,
} from './utils/salesWidgetTestRegistry';

describe( 'SalesByVisitorTypeWidget', () => {
	let registry: WPDataRegistry;

	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_SALES_BY_VISITOR_TYPE
	);

	function getReportOptions() {
		return {
			...registry.select( CORE_USER ).getDateRangeDates(),
			dimensions: [ 'newVsReturning' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
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
			reportID: 'analytics-4_goal-driver-reports_visitor-type',
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
			<SalesByVisitorTypeWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__loading' )
		).toBeInTheDocument();
	} );

	testGenericReportError(
		() => registry,
		SalesByVisitorTypeWidget,
		widgetProps
	);

	testInsufficientPermissionsError(
		() => registry,
		SalesByVisitorTypeWidget,
		widgetProps
	);

	it( 'should render the zero data state when the report has no rows', async () => {
		const reportOptions = getReportOptions();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: reportOptions } );

		const { container, getByText, waitForRegistry } = render(
			<SalesByVisitorTypeWidget { ...widgetProps } />,
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

	it( "should render each visitor type's share of the total as a percentage", async () => {
		const reportOptions = getReportOptions();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [ { value: 'new' } ],
						metricValues: [ { value: '75' } ],
					},
					{
						dimensionValues: [ { value: 'returning' } ],
						metricValues: [ { value: '25' } ],
					},
				],
			},
			{ options: reportOptions }
		);

		const { getByText, waitForRegistry } = render(
			<SalesByVisitorTypeWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'New visitors' ) ).toBeInTheDocument();
		expect( getByText( '75%' ) ).toBeInTheDocument();
		expect( getByText( 'Returning visitors' ) ).toBeInTheDocument();
		expect( getByText( '25%' ) ).toBeInTheDocument();
	} );
} );
