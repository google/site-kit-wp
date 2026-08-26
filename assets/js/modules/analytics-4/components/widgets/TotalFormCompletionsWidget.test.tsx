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
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { buildPrimaryEventReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ERROR_INTERNAL_SERVER_ERROR } from '@/js/util/errors';
import { render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '@tests/js/utils';
import TotalFormCompletionsWidget from './TotalFormCompletionsWidget';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

describe( 'TotalFormCompletionsWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		KM_ANALYTICS_TOTAL_FORM_COMPLETIONS
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
		freezeFetch( reportEndpoint );

		const { container, waitForRegistry } = render(
			<TotalFormCompletionsWidget { ...widgetProps } />,
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

	it( 'should render the error variant when the report fetch fails', async () => {
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
			<TotalFormCompletionsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();
	} );

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

	it( 'should render the current period total form completions count and the change vs. the previous period', async () => {
		const reportOptions = getReportOptions();

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
			{ options: reportOptions }
		);

		const { container, getByText, waitForRegistry } = render(
			<TotalFormCompletionsWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__metric' )
		).toHaveTextContent( '150' );
		expect( getByText( '150' ) ).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '+50%' );
	} );
} );
