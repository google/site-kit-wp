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
 * External dependencies
 */
import { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { createChartWrapper } from '@/js/components/GoogleChart/test-utils';
import {
	createDailyTrafficRows,
	getPropertyCreateTimeAtMidday,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { render } from '@tests/js/test-utils';
import TypicalTrafficChart, {
	TypicalTrafficChartProps,
} from './TypicalTrafficChart';

const mockGoogleChart = jest.fn();

// Google Charts draws nothing under Jest, so `GoogleChartMock` records the
// props each test reads, and renders the children the chart positions.
jest.mock( '@/js/components/GoogleChart', () => {
	return function GoogleChartMock( props: {
		children?: ReactNode;
		[ key: string ]: unknown;
	} ) {
		mockGoogleChart( props );
		return <div className="googlesitekit-chart">{ props.children }</div>;
	};
} );

describe( 'TypicalTrafficChart', () => {
	// A 28-day range ending on `2026-09-15`, with 395 days of 120 visitors.
	const defaultProps: TypicalTrafficChartProps = {
		dailyTraffic: createDailyTrafficRows( '2026-09-15', () => 120 ),
		selectedStartDate: '2026-08-19',
		selectedEndDate: '2026-09-15',
		daysInSelectedRange: 28,
	};

	afterEach( () => {
		mockGoogleChart.mockClear();
	} );

	it( 'should plot the 395 days of the rows for a 28-day and for a 90-day range', () => {
		const { rerender } = render(
			<TypicalTrafficChart { ...defaultProps } />
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].data.slice( 1 )
		).toHaveLength( 395 );

		rerender(
			<TypicalTrafficChart
				{ ...defaultProps }
				selectedStartDate="2026-06-18"
				daysInSelectedRange={ 90 }
			/>
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].data.slice( 1 )
		).toHaveLength( 395 );
	} );

	it( 'should move the whole 395-day window when the range ends on a later day', () => {
		render(
			<TypicalTrafficChart
				{ ...defaultProps }
				dailyTraffic={ createDailyTrafficRows(
					'2026-09-22',
					() => 120
				) }
				selectedStartDate="2026-08-26"
				selectedEndDate="2026-09-22"
			/>
		);

		const { data, plottedStartDate, plottedEndDate } =
			mockGoogleChart.mock.lastCall[ 0 ];
		const points = data.slice( 1 );

		expect( points ).toHaveLength( 395 );
		expect( points[ 0 ][ 0 ] ).toEqual( new Date( 2025, 7, 24 ) );
		expect( points[ 394 ][ 0 ] ).toEqual( new Date( 2026, 8, 22 ) );
		expect( plottedStartDate ).toBe( '2025-08-24' );
		expect( plottedEndDate ).toBe( '2026-09-22' );
	} );

	it( 'should label the horizontal axis with the short name of each month, over transparent gridlines', () => {
		render( <TypicalTrafficChart { ...defaultProps } /> );

		const { options } = mockGoogleChart.mock.lastCall[ 0 ];

		expect( options.hAxis.format ).toBe( 'MMM' );
		expect( options.hAxis.gridlines.color ).toBe( 'transparent' );
		expect( options.hAxis.ticks ).toHaveLength( 13 );
		expect( options.hAxis.ticks[ 0 ] ).toEqual( new Date( 2025, 8, 1 ) );
		expect( options.hAxis.ticks[ 12 ] ).toEqual( new Date( 2026, 8, 1 ) );
	} );

	it( 'should draw the gray line along the right edge on the last plotted day', () => {
		render( <TypicalTrafficChart { ...defaultProps } /> );

		const { options } = mockGoogleChart.mock.lastCall[ 0 ];

		expect( options.hAxis.baseline ).toEqual( new Date( 2026, 8, 15 ) );
	} );

	it( 'should set no maximum on the value axis when a day has visitors', () => {
		render(
			<TypicalTrafficChart
				{ ...defaultProps }
				dailyTraffic={ createDailyTrafficRows(
					'2026-09-15',
					( _dayIndex, date ) => ( date === '2025-10-15' ? 900 : 0 )
				) }
			/>
		);

		const { options } = mockGoogleChart.mock.lastCall[ 0 ];

		expect( options.vAxis.viewWindow ).toEqual( { min: 0 } );
	} );

	it( 'should run the value axis to 100 when every day has no visitors', () => {
		render(
			<TypicalTrafficChart
				{ ...defaultProps }
				dailyTraffic={ createDailyTrafficRows( '2026-09-15', () => 0 ) }
			/>
		);

		const { options } = mockGoogleChart.mock.lastCall[ 0 ];

		expect( options.vAxis.viewWindow ).toEqual( { min: 0, max: 100 } );
	} );

	it( 'should mark the day the property was created when it is in the window but outside the selected range', () => {
		render(
			<TypicalTrafficChart
				{ ...defaultProps }
				propertyCreateTime={ getPropertyCreateTimeAtMidday(
					'2025-10-01'
				) }
			/>
		);

		const { dateMarkers, plottedStartDate, plottedEndDate } =
			mockGoogleChart.mock.lastCall[ 0 ];

		expect( dateMarkers ).toEqual( [
			{
				date: '2025-10-01',
				text: 'Google Analytics property created',
			},
		] );
		expect( plottedStartDate ).toBe( '2025-08-17' );
		expect( plottedEndDate ).toBe( '2026-09-15' );
	} );

	it( 'should mark the day the property was created when it is the first plotted day', () => {
		render(
			<TypicalTrafficChart
				{ ...defaultProps }
				propertyCreateTime={ getPropertyCreateTimeAtMidday(
					'2025-08-17'
				) }
			/>
		);

		expect( mockGoogleChart.mock.lastCall[ 0 ].dateMarkers ).toEqual( [
			{
				date: '2025-08-17',
				text: 'Google Analytics property created',
			},
		] );
	} );

	it( 'should mark the day the property was created when it is the last plotted day', () => {
		render(
			<TypicalTrafficChart
				{ ...defaultProps }
				propertyCreateTime={ getPropertyCreateTimeAtMidday(
					'2026-09-15'
				) }
			/>
		);

		expect( mockGoogleChart.mock.lastCall[ 0 ].dateMarkers ).toEqual( [
			{
				date: '2026-09-15',
				text: 'Google Analytics property created',
			},
		] );
	} );

	it( 'should not draw a date marker when the property was created before the window', () => {
		render(
			<TypicalTrafficChart
				{ ...defaultProps }
				propertyCreateTime={ getPropertyCreateTimeAtMidday(
					'2025-08-16'
				) }
			/>
		);

		expect(
			mockGoogleChart.mock.lastCall[ 0 ].dateMarkers
		).toBeUndefined();
	} );

	it( 'should make room above the chart for the date marker only when it draws one', () => {
		const { container, rerender } = render(
			<TypicalTrafficChart { ...defaultProps } />
		);

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__chart--has-date-marker'
			)
		).not.toBeInTheDocument();

		rerender(
			<TypicalTrafficChart
				{ ...defaultProps }
				propertyCreateTime={ getPropertyCreateTimeAtMidday(
					'2025-10-01'
				) }
			/>
		);

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__chart--has-date-marker'
			)
		).toBeInTheDocument();
	} );

	it( 'should read the day the property was created to a screen reader', () => {
		const { getByText } = render(
			<TypicalTrafficChart
				{ ...defaultProps }
				propertyCreateTime={ getPropertyCreateTimeAtMidday(
					'2025-10-01'
				) }
			/>
		);

		expect(
			getByText( 'Google Analytics property created on October 1, 2025.' )
		).toBeInTheDocument();
	} );

	it( 'should not pass `gatheringData`, which would cut the window down to the selected range', () => {
		render( <TypicalTrafficChart { ...defaultProps } /> );

		expect( mockGoogleChart.mock.lastCall[ 0 ] ).not.toHaveProperty(
			'gatheringData'
		);
	} );

	it( 'should position the selected-range region from the chart layout, and move it when the chart redraws', () => {
		const { container } = render(
			<TypicalTrafficChart { ...defaultProps } />
		);

		const { onReady } = mockGoogleChart.mock.lastCall[ 0 ];
		const region = container.querySelector(
			'.googlesitekit-traffic-overview__selected-range-region'
		);

		onReady( {
			chartWrapper: createChartWrapper(
				{ '2026-08-19': 1020, '2026-09-15': 1100 },
				{ top: 8, height: 224 }
			),
		} );

		expect( region ).toHaveStyle( {
			left: '1020px',
			width: '80px',
			top: '8px',
			height: '224px',
		} );

		// A narrower browser window draws the same days closer to the left
		// edge.
		onReady( {
			chartWrapper: createChartWrapper(
				{ '2026-08-19': 600, '2026-09-15': 650 },
				{ top: 8, height: 200 }
			),
		} );

		expect( region ).toHaveStyle( {
			left: '600px',
			width: '50px',
			top: '8px',
			height: '200px',
		} );
	} );

	it( 'should show one legend item for the selected range, beside a line in `#462083`', () => {
		const { getByRole, rerender } = render(
			<TypicalTrafficChart { ...defaultProps } />
		);

		expect( getByRole( 'listitem' ) ).toHaveTextContent(
			'Last 28 days traffic'
		);
		expect(
			getByRole( 'listitem' ).querySelector(
				'.googlesitekit-traffic-overview__chart-legend-line'
			)
		).toHaveStyle( { backgroundColor: '#462083' } );

		rerender(
			<TypicalTrafficChart
				{ ...defaultProps }
				selectedStartDate="2026-06-18"
				daysInSelectedRange={ 90 }
			/>
		);

		expect( getByRole( 'listitem' ) ).toHaveTextContent(
			'Last 90 days traffic'
		);
	} );
} );
