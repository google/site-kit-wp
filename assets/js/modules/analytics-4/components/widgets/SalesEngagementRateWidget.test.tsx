/**
 * SalesEngagementRateWidget component tests.
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
	KM_ANALYTICS_SALES_ENGAGEMENT_RATE,
} from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { buildEngagementReportOptions } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
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
import SalesEngagementRateWidget from './SalesEngagementRateWidget';

type WidgetComponentProps = ReturnType< typeof getWidgetComponentProps >;

describe( 'SalesEngagementRateWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		KM_ANALYTICS_SALES_ENGAGEMENT_RATE
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
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
	} );

	function getEngagementReportOptions() {
		const dates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );

		return buildEngagementReportOptions( dates );
	}

	it( 'should render the loading state while resolving the report', async () => {
		freezeFetch( reportEndpoint );

		const { container, waitForRegistry } = render(
			<SalesEngagementRateWidget { ...widgetProps } />,
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
			<SalesEngagementRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();
	} );

	it( 'should render zero values when there is no engagement data in either period', async () => {
		const engagementReportOptions = getEngagementReportOptions();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [] },
				{ options: engagementReportOptions }
			);

		const { container, waitForRegistry } = render(
			<SalesEngagementRateWidget { ...widgetProps } />,
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

	it( 'should render the current period engagement rate, sessions subtext, and the change vs. the previous period', async () => {
		const engagementReportOptions = getEngagementReportOptions();

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
			<SalesEngagementRateWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__metric' )
		).toHaveTextContent( '65%' );
		expect( getByText( '65%' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-km-widget-tile__subtext' )
		).toHaveTextContent( 'of 500 total sessions' );

		// change = currentEngagementRate (65%) - previousEngagementRate (55%) = +10 percentage points.
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '+10%' );
	} );
} );
