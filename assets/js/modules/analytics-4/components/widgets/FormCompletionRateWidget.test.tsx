/**
 * FormCompletionRateWidget component tests.
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
	KM_ANALYTICS_FORM_COMPLETION_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	buildEngagementReportOptions,
	buildPrimaryEventReportOptions,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ERROR_INTERNAL_SERVER_ERROR } from '@/js/util/errors';
import { render, within } from '@tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '@tests/js/utils';
import FormCompletionRateWidget from './FormCompletionRateWidget';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

describe( 'FormCompletionRateWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		KM_ANALYTICS_FORM_COMPLETION_RATE
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

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
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.CONTACT,
				ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
				ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
			] );
	} );

	function getDates() {
		return registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );
	}

	function getPrimaryEventReportOptions() {
		const detectedLeadEvents = registry
			.select( MODULES_ANALYTICS_4 )
			.getDetectedLeadEvents();

		return buildPrimaryEventReportOptions( getDates(), detectedLeadEvents );
	}

	function getEngagementReportOptions() {
		return buildEngagementReportOptions( getDates() );
	}

	it( 'should render the loading state while resolving the reports', async () => {
		// This widget requests two reports (primary event + engagement), so
		// the frozen fetch mock must cover both GET requests.
		freezeFetch( reportEndpoint, { repeat: 2 } );

		const { container, waitForRegistry } = render(
			<FormCompletionRateWidget { ...widgetProps } />,
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

	it( 'should render the error variant when a report fetch fails', async () => {
		provideModuleRegistrations( registry );

		const errorResponse = {
			code: ERROR_INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
			data: { reason: ERROR_INTERNAL_SERVER_ERROR },
		};

		fetchMock.get( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { container, getByText, waitForRegistry } = render(
			<FormCompletionRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();
	} );

	it( 'should render zero values when there are no form completions or sessions in either period', async () => {
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
			<FormCompletionRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		const metricElement = container.querySelector(
			'.googlesitekit-km-widget-tile__metric'
		);
		expect( metricElement ).toBeInTheDocument();
		expect(
			// eslint-disable-next-line sitekit/acronym-case
			within( metricElement as HTMLElement ).getByText( '0%' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__subtext' )
		).toHaveTextContent( 'of 0 total sessions' );

		const changeBadge = container.querySelector(
			'.googlesitekit-change-badge'
		);
		expect( changeBadge ).toBeInTheDocument();
		expect(
			// eslint-disable-next-line sitekit/acronym-case
			within( changeBadge as HTMLElement ).getByText( '0%' )
		).toBeInTheDocument();
	} );

	it( 'should render the current period form completion rate, sessions subtext, and the change vs. the previous period', async () => {
		const primaryEventReportOptions = getPrimaryEventReportOptions();
		const engagementReportOptions = getEngagementReportOptions();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.CONTACT },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '150' } ],
					},
					{
						dimensionValues: [
							{ value: ENUM_CONVERSION_EVENTS.CONTACT },
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
			<FormCompletionRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		// currentRate = 150 form completions / 500 sessions = 30%.
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
