/**
 * TotalFormCompletionsWidget component tests.
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
	KM_ANALYTICS_TOTAL_FORM_COMPLETIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { buildPrimaryEventReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/report-utils/headlineMetrics';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { render } from '@tests/js/test-utils';
import { createTestRegistry, freezeFetch } from '@tests/js/utils';
import TotalFormCompletionsWidget from './TotalFormCompletionsWidget';
import {
	KEY_METRICS_WIDGET_REPORT_ENDPOINT,
	testGenericReportError,
} from './utils/keyMetricsWidgetTestHelpers';
import { provideLeadsWidgetTestRegistry } from './utils/leadsWidgetTestRegistry';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

describe( 'TotalFormCompletionsWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		KM_ANALYTICS_TOTAL_FORM_COMPLETIONS
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideLeadsWidgetTestRegistry( registry );
	} );

	function getReportOptions() {
		const dates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );
		const detectedLeadEvents = registry
			.select( MODULES_ANALYTICS_4 )
			.getDetectedLeadEvents();

		return buildPrimaryEventReportOptions( dates, detectedLeadEvents );
	}

	it( 'should render the loading state while resolving the report', async () => {
		freezeFetch( KEY_METRICS_WIDGET_REPORT_ENDPOINT );

		const { container, waitForRegistry } = render(
			<TotalFormCompletionsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__loading' )
		).toBeInTheDocument();
	} );

	it( 'should not remain stuck loading when no lead events are detected', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		const { container, waitForRegistry } = render(
			<TotalFormCompletionsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__loading' )
		).not.toBeInTheDocument();
	} );

	testGenericReportError(
		() => registry,
		TotalFormCompletionsWidget,
		widgetProps,
		KEY_METRICS_WIDGET_REPORT_ENDPOINT
	);

	it( 'should render zero values when there are no form completions in either period', async () => {
		const reportOptions = getReportOptions();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { rows: [] }, { options: reportOptions } );

		const { container, getByText, waitForRegistry } = render(
			<TotalFormCompletionsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__metric' )
		).toHaveTextContent( '0' );
		expect( getByText( '0' ) ).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '0%' );
	} );

	it( 'should sum form completions across every detected lead event and render the change vs. the previous period', async () => {
		const reportOptions = getReportOptions();

		// `provideLeadsWidgetTestRegistry()` detects three lead events, so the
		// report has one row per event per date range; the rendered count must
		// be the sum across all of them, not just the first row found.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.CONTACT },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '100' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.CONTACT },
							{ value: 'date_range_1' },
						],
						metricValues: [ { value: '50' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '50' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM },
							{ value: 'date_range_1' },
						],
						metricValues: [ { value: '30' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.GENERATE_LEAD },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '30' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.GENERATE_LEAD },
							{ value: 'date_range_1' },
						],
						metricValues: [ { value: '20' } ],
					},
				],
			},
			{ options: reportOptions }
		);

		const { container, getByText, waitForRegistry } = render(
			<TotalFormCompletionsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// currentPrimaryCount = 100 + 50 + 30 = 180; previousPrimaryCount = 50 + 30 + 20 = 100.
		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__metric' )
		).toHaveTextContent( '180' );
		expect( getByText( '180' ) ).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '+80%' );
	} );
} );
