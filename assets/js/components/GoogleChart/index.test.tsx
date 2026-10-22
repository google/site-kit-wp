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
import { getDateString } from '@/js/util';
import {
	act,
	createTestRegistry,
	provideTimezone,
	render,
} from '@tests/js/test-utils';
import GoogleChart from './';

const mockChart = jest.fn();

// Google Charts loads its script from the web, which Jest never runs. The
// mock records its props, so a test can fire the chart's `ready` event.
jest.mock( 'react-google-charts', () => ( {
	Chart: function ChartMock( props: Record< string, unknown > ) {
		mockChart( props );
		return <div className="googlesitekit-chart__inner" />;
	},
} ) );

/**
 * Fires the chart's `ready` event, as Google Charts does once it has drawn the
 * chart, so `GoogleChart` draws its date markers.
 *
 * Call it after `render()`. The chart layout puts the three days of the range
 * 20px apart, so a line drawn on the day before or after the marked day is
 * 20px off.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
function fireChartReadyEvent() {
	const xLocations: Record< string, number > = {
		'2025-01-14': 100,
		'2025-01-15': 120,
		'2025-01-16': 140,
	};
	const chartWrapper = {
		getChart: () => ( {
			getChartLayoutInterface: () => ( {
				getChartAreaBoundingBox: () => ( {
					top: 8,
					height: 224,
				} ),
				getXLocation: ( day: Date ) =>
					xLocations[ getDateString( day ) ],
			} ),
		} ),
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
}

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

	it( 'should draw only the date markers inside the selected date range', () => {
		const { container } = render(
			<GoogleChart
				chartType="LineChart"
				dateMarkers={ [
					{ date: '2025-01-05', text: 'Before the range' },
					{ date: '2025-01-15', text: 'Inside the range' },
					{ date: '2025-01-17', text: 'After the range' },
				] }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		fireChartReadyEvent();

		const markerTooltips = container.querySelectorAll(
			'.googlesitekit-chart__date-marker-tooltip'
		);
		const markerLines = container.querySelectorAll(
			'.googlesitekit-chart__date-marker-line'
		);

		expect( markerTooltips ).toHaveLength( 1 );
		expect( markerLines ).toHaveLength( 1 );
		// `2025-01-15` sits at 120px in the chart layout, and the line is drawn
		// 1px left of it.
		expect( markerLines[ 0 ] ).toHaveStyle( { left: '119px' } );
	} );

	// Jest runs in the machine's time zone, so the tests that follow pin a zone
	// where UTC midnight isn't local midnight. West of UTC, a marker's day read
	// as UTC midnight falls on the evening before, so these cases catch a range
	// check or a line that reads it that way.
	describe( 'in the America/New_York time zone', () => {
		let originalTimezone: string | undefined;

		beforeEach( () => {
			originalTimezone = provideTimezone( 'America/New_York' );
		} );

		afterEach( () => {
			provideTimezone( originalTimezone );
		} );

		it( 'should draw a date marker on the first day of the selected date range', () => {
			const { container } = render(
				<GoogleChart
					chartType="LineChart"
					dateMarkers={ [
						{ date: '2025-01-14', text: 'Property created' },
					] }
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
						{ date: '2025-01-15', text: 'Property created' },
					] }
				/>,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			fireChartReadyEvent();

			// The line is drawn 1px left of the day's position.
			expect(
				container.querySelector(
					'.googlesitekit-chart__date-marker-line'
				)
			).toHaveStyle( { left: '119px', top: '8px', height: '224px' } );
		} );
	} );

	// East of UTC, a marker's day read as UTC midnight falls after that day's
	// local midnight, so this case catches a range check that reads it that way.
	describe( 'in the Asia/Riyadh time zone', () => {
		let originalTimezone: string | undefined;

		beforeEach( () => {
			originalTimezone = provideTimezone( 'Asia/Riyadh' );
		} );

		afterEach( () => {
			provideTimezone( originalTimezone );
		} );

		it( 'should draw a date marker on the last day of the selected date range', () => {
			const { container } = render(
				<GoogleChart
					chartType="LineChart"
					dateMarkers={ [
						{ date: '2025-01-16', text: 'Property created' },
					] }
				/>,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			expect(
				container.querySelectorAll(
					'.googlesitekit-chart__date-marker-line'
				)
			).toHaveLength( 1 );
		} );
	} );
} );
