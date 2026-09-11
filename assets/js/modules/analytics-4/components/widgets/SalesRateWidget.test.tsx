/**
 * SalesRateWidget component tests.
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
	KM_ANALYTICS_SALES_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	buildEngagementReportOptions,
	buildPrimaryEventReportOptions,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/headlineMetrics';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { render, within } from '@tests/js/test-utils';
import { createTestRegistry, freezeFetch } from '@tests/js/utils';
import SalesRateWidget from './SalesRateWidget';
import {
	SALES_WIDGET_REPORT_ENDPOINT,
	provideSalesWidgetTestRegistry,
	testGenericReportError,
} from './utils/salesWidgetTestRegistry';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

describe( 'SalesRateWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		KM_ANALYTICS_SALES_RATE
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideSalesWidgetTestRegistry( registry );
	} );

	function getPrimaryEventReportOptions() {
		const dates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );

		return buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
	}

	function getEngagementReportOptions() {
		const dates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );

		return buildEngagementReportOptions( dates );
	}

	it( 'should render the loading state while resolving the reports', async () => {
		// This widget requests two reports (primary event + engagement), so
		// the frozen fetch mock must cover both GET requests.
		freezeFetch( SALES_WIDGET_REPORT_ENDPOINT, { repeat: 2 } );

		const { container, waitForRegistry } = render(
			<SalesRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__loading' )
		).toBeInTheDocument();
	} );

	testGenericReportError( () => registry, SalesRateWidget, widgetProps );

	it( 'should render zero values when there are no purchases or sessions in either period', async () => {
		const primaryEventReportOptions = getPrimaryEventReportOptions();
		const engagementReportOptions = getEngagementReportOptions();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ rows: [] },
				{ options: primaryEventReportOptions }
			);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [] },
				{ options: engagementReportOptions }
			);

		const { container, waitForRegistry } = render(
			<SalesRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		const metricElement = container.querySelector(
			'.googlesitekit-km-widget-tile__metric'
			// eslint-disable-next-line sitekit/acronym-case
		) as HTMLElement;
		expect( metricElement ).toBeInTheDocument();
		expect( within( metricElement ).getByText( '0%' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__subtext' )
		).toHaveTextContent( 'of 0 total sessions' );

		const changeBadge = container.querySelector(
			'.googlesitekit-change-badge'
			// eslint-disable-next-line sitekit/acronym-case
		) as HTMLElement;
		expect( changeBadge ).toBeInTheDocument();
		expect( within( changeBadge ).getByText( '0%' ) ).toBeInTheDocument();
	} );

	it( 'should render the current period sales rate, sessions subtext, and the change vs. the previous period', async () => {
		const primaryEventReportOptions = getPrimaryEventReportOptions();
		const engagementReportOptions = getEngagementReportOptions();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.PURCHASE },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '150' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.PURCHASE },
							{ value: 'date_range_1' },
						],
						metricValues: [ { value: '100' } ],
					},
				],
			},
			{ options: primaryEventReportOptions }
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				totals: [
					{
						dimensionValues: [ { value: 'date_range_0' } ],
						metricValues: [ { value: '0.65' }, { value: '500' } ],
					},
					{
						dimensionValues: [ { value: 'date_range_1' } ],
						metricValues: [ { value: '0.55' }, { value: '400' } ],
					},
				],
			},
			{ options: engagementReportOptions }
		);

		const { container, getByText, waitForRegistry } = render(
			<SalesRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// currentRate = 150 purchases / 500 sessions = 30%.
		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__metric' )
		).toHaveTextContent( '30%' );
		expect( getByText( '30%' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__subtext' )
		).toHaveTextContent( 'of 500 total sessions' );

		// previousRate = 100 / 400 = 25%; change = 30% - 25% = +5 percentage points.
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '+5%' );
	} );
} );
