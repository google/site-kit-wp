/**
 * TypicalTrafficChart tests.
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
 * Internal dependencies
 */
import { createDailyTrafficRows } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { render } from '@tests/js/test-utils';
import TypicalTrafficChart from './TypicalTrafficChart';

const mockGoogleChart = jest.fn();

// Google Charts loads from the web and draws nothing under Jest. The mock keeps
// the props, so each test reads what the chart received.
jest.mock( '@/js/components/GoogleChart', () => {
	return function GoogleChartMock( props: Record< string, unknown > ) {
		mockGoogleChart( props );
		return <div className="googlesitekit-chart" />;
	};
} );

describe( 'TypicalTrafficChart', () => {
	afterEach( () => {
		mockGoogleChart.mockClear();
	} );

	it( 'should plot 28 points for the 28 rows of a 28-day range', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].data.slice( 1 )
		).toHaveLength( 28 );
	} );

	it( 'should plot 90 points for the 90 rows of a 90-day range', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					90,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 90 }
			/>
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].data.slice( 1 )
		).toHaveLength( 90 );
	} );

	it( 'should label the horizontal axis with dates such as "Aug 20" from the second day on', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		const { hAxis } = mockGoogleChart.mock.lastCall[ 0 ].options;

		expect( hAxis.format ).toBe( 'MMM d' );
		expect( hAxis.ticks ).toHaveLength( 27 );
		expect( hAxis.ticks[ 0 ] ).toEqual( new Date( 2026, 7, 20 ) );
	} );

	it( 'should draw no vertical gridlines', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].options.hAxis.gridlines.color
		).toBe( 'transparent' );
	} );

	it( 'should draw the gray line along the right edge of the chart area on the last day', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		const { hAxis } = mockGoogleChart.mock.lastCall[ 0 ].options;

		expect( hAxis.baseline ).toEqual( new Date( 2026, 8, 15 ) );
		expect( hAxis.baselineColor ).toBe( '#b8bdb9' );
	} );

	it( 'should end the value axis on a round number at or above the busiest day when a day has visits', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					( dayIndex ) => ( dayIndex === 9 ? 2376 : 120 )
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].options.vAxis.viewWindow
		).toEqual( { min: 0 } );
	} );

	it( 'should run the value axis from 0 to 100 when every day has 0 visits', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 0
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].options.vAxis.viewWindow
		).toEqual( { min: 0, max: 100 } );
	} );

	it( 'should show no gathering data notice over the chart', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		// `GoogleChart` shows its gathering data notice over the chart when it
		// gets `gatheringData`.
		expect(
			mockGoogleChart.mock.lastCall[ 0 ].gatheringData
		).toBeUndefined();
	} );

	it( 'should draw no "Google Analytics property created" marker', () => {
		render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].dateMarkers
		).toBeUndefined();
	} );

	it( 'should show the "Last 28 days traffic" legend item beside a line in #462083 for a 28-day range', () => {
		const { getByRole } = render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 28 }
			/>
		);

		const legendItem = getByRole( 'listitem' );

		expect( legendItem ).toHaveTextContent( 'Last 28 days traffic' );
		expect(
			legendItem.querySelector(
				'.googlesitekit-traffic-overview__chart-legend-line'
			)
		).toHaveStyle( { backgroundColor: '#462083' } );
	} );

	it( 'should show the "Last 90 days traffic" legend item for a 90-day range', () => {
		const { getByRole } = render(
			<TypicalTrafficChart
				dailyTraffic={ createDailyTrafficRows(
					90,
					'2026-09-15',
					() => 120
				) }
				daysInSelectedRange={ 90 }
			/>
		);

		expect( getByRole( 'listitem' ) ).toHaveTextContent(
			'Last 90 days traffic'
		);
	} );
} );
