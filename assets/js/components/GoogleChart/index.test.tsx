/**
 * GoogleChart tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	act,
	createTestRegistry,
	provideTimezone,
	render,
} from '@tests/js/test-utils';
import GoogleChart from './';
import { createChartWrapper } from './test-utils';

const mockChart = jest.fn();

// Google Charts loads its script from the web, which Jest never runs. The
// mock records its props, so a test can fire the chart's `ready` event.
jest.mock( 'react-google-charts', () => ( {
	Chart: function ChartMock( props: Record< string, unknown > ) {
		mockChart( props );
		return <div className="googlesitekit-chart__inner" />;
	},
} ) );

describe( 'GoogleChart', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		// `last-3-days` against the `2025-01-16` reference date covers
		// `2025-01-14`, `2025-01-15`, and `2025-01-16`.
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-01-16' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-3-days' );
	} );

	afterEach( () => {
		mockChart.mockClear();
	} );

	it( 'should draw a date marker outside the selected date range but inside the plotted days', () => {
		const { container } = render(
			<GoogleChart
				chartType="LineChart"
				dateMarkers={ [
					{ date: '2025-01-05', text: 'Property created' },
				] }
				plottedStartDate="2025-01-01"
				plottedEndDate="2025-01-16"
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		expect(
			container.querySelectorAll(
				'.googlesitekit-chart__date-marker-line'
			)
		).toHaveLength( 1 );
	} );

	it( 'should draw only the date markers inside the selected date range when no plotted days are passed', () => {
		const { container } = render(
			<GoogleChart
				chartType="LineChart"
				dateMarkers={ [
					{ date: '2025-01-05', text: 'Outside the range' },
					{ date: '2025-01-15', text: 'Inside the range' },
				] }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		const markerTooltips = container.querySelectorAll(
			'.googlesitekit-chart__date-marker-tooltip'
		);

		expect( markerTooltips ).toHaveLength( 1 );
		expect(
			container.querySelectorAll(
				'.googlesitekit-chart__date-marker-line'
			)
		).toHaveLength( 1 );
	} );

	// Jest runs in the machine's time zone, so these tests pin one zone west
	// and one east of UTC, where UTC midnight isn't local midnight.
	describe.each( [ 'America/New_York', 'Asia/Riyadh' ] )(
		'in the %s time zone',
		( timezone ) => {
			let originalTimezone: string | undefined;

			beforeEach( () => {
				originalTimezone = provideTimezone( timezone );
			} );

			afterEach( () => {
				provideTimezone( originalTimezone );
			} );

			it( 'should draw a date marker on the first plotted day', () => {
				const { container } = render(
					<GoogleChart
						chartType="LineChart"
						dateMarkers={ [
							{ date: '2025-01-01', text: 'Property created' },
						] }
						plottedStartDate="2025-01-01"
						plottedEndDate="2025-01-16"
					/>,
					{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
				);

				expect(
					container.querySelectorAll(
						'.googlesitekit-chart__date-marker-line'
					)
				).toHaveLength( 1 );
			} );

			it( 'should draw a date marker on the last plotted day', () => {
				const { container } = render(
					<GoogleChart
						chartType="LineChart"
						dateMarkers={ [
							{ date: '2025-01-16', text: 'Property created' },
						] }
						plottedStartDate="2025-01-01"
						plottedEndDate="2025-01-16"
					/>,
					{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
				);

				expect(
					container.querySelectorAll(
						'.googlesitekit-chart__date-marker-line'
					)
				).toHaveLength( 1 );
			} );

			it( 'should draw the date marker line at the position of the marked day', () => {
				const { container } = render(
					<GoogleChart
						chartType="LineChart"
						dateMarkers={ [
							{ date: '2025-01-05', text: 'Property created' },
						] }
						plottedStartDate="2025-01-01"
						plottedEndDate="2025-01-16"
					/>,
					{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
				);

				const chartWrapper = {
					...createChartWrapper(
						{
							'2025-01-04': 100,
							'2025-01-05': 120,
							'2025-01-06': 140,
						},
						{ top: 8, height: 224 }
					),
					getDataTable: () => ( {} ),
				};
				const google = {
					visualization: {
						events: { removeAllListeners: jest.fn() },
					},
				};

				const { getChartWrapper } = mockChart.mock.calls[ 0 ][ 0 ];

				act( () => {
					getChartWrapper( chartWrapper, google );
				} );

				const { calls } = mockChart.mock;
				const { chartEvents } = calls[ calls.length - 1 ][ 0 ];

				act( () => {
					chartEvents
						.find(
							( { eventName }: { eventName: string } ) =>
								eventName === 'ready'
						)
						.callback( { chartWrapper, google } );
				} );

				// The line is drawn 1px left of the day's position.
				expect(
					container.querySelector(
						'.googlesitekit-chart__date-marker-line'
					)
				).toHaveStyle( { left: '119px', top: '8px', height: '224px' } );
			} );
		}
	);
} );
