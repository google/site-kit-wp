/**
 * LeadsByDeviceTypeWidget component tests.
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
	KM_ANALYTICS_LEADS_BY_DEVICE_TYPE,
} from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { render } from '@tests/js/test-utils';
import { createTestRegistry, freezeFetch } from '@tests/js/utils';
import LeadsByDeviceTypeWidget from './LeadsByDeviceTypeWidget';
import {
	LEADS_WIDGET_REPORT_ENDPOINT,
	provideLeadsWidgetTestRegistry,
	testGenericReportError,
	testInsufficientPermissionsError,
} from './utils/leadsWidgetTestRegistry';

describe( 'LeadsByDeviceTypeWidget', () => {
	let registry: WPDataRegistry;

	const widgetProps = getWidgetComponentProps(
		KM_ANALYTICS_LEADS_BY_DEVICE_TYPE
	);

	function getReportOptions() {
		return {
			...registry.select( CORE_USER ).getDateRangeDates(),
			dimensions: [ 'deviceCategory' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [
						ENUM_CONVERSION_EVENTS.CONTACT,
						ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
						ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
					],
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
			reportID: 'analytics-4_goal-driver-reports_device-type',
		};
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideLeadsWidgetTestRegistry( registry );
	} );

	it( 'should render the loading state while resolving the report', async () => {
		// Freeze the report fetch to keep the widget in loading state.
		freezeFetch( LEADS_WIDGET_REPORT_ENDPOINT );

		const { container, waitForRegistry } = render(
			<LeadsByDeviceTypeWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__loading' )
		).toBeInTheDocument();
	} );

	testGenericReportError(
		() => registry,
		LeadsByDeviceTypeWidget,
		widgetProps
	);

	testInsufficientPermissionsError(
		() => registry,
		LeadsByDeviceTypeWidget,
		widgetProps
	);

	it( 'should render the zero data state when the report has no rows', async () => {
		const reportOptions = getReportOptions();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( {}, { options: reportOptions } );

		const { container, getByText, waitForRegistry } = render(
			<LeadsByDeviceTypeWidget { ...widgetProps } />,
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

	it( "should render each device type's share of the total as a percentage", async () => {
		const reportOptions = getReportOptions();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [ { value: 'mobile' } ],
						metricValues: [ { value: '60' } ],
					},
					{
						dimensionValues: [ { value: 'desktop' } ],
						metricValues: [ { value: '25' } ],
					},
					{
						dimensionValues: [ { value: 'tablet' } ],
						metricValues: [ { value: '15' } ],
					},
				],
			},
			{ options: reportOptions }
		);

		const { getByText, waitForRegistry } = render(
			<LeadsByDeviceTypeWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'mobile' ) ).toBeInTheDocument();
		expect( getByText( '60%' ) ).toBeInTheDocument();
		expect( getByText( 'desktop' ) ).toBeInTheDocument();
		expect( getByText( '25%' ) ).toBeInTheDocument();
		expect( getByText( 'tablet' ) ).toBeInTheDocument();
		expect( getByText( '15%' ) ).toBeInTheDocument();
	} );
} );
