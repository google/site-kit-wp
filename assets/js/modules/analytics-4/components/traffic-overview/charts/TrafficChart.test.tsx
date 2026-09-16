/**
 * Traffic Overview chart tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getGraphReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getAnalytics4MockResponse } from '@/js/modules/analytics-4/utils/data-mock';
import { render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import TrafficChart from './TrafficChart';

const mockGoogleChart = jest.fn();

// Google Charts draws nothing under Jest, so `GoogleChartMock` records the
// props each test reads.
jest.mock( '@/js/components/GoogleChart', () => {
	return function GoogleChartMock( props: Record< string, unknown > ) {
		mockGoogleChart( props );
		return <div className="googlesitekit-chart" />;
	};
} );

describe( 'TrafficChart', () => {
	let registry: WPDataRegistry;

	// `getAnalytics4MockResponse` returns the same numbers for the same options,
	// so the report for `2025-01-14` to `2025-01-16` always has 55, 14, and 3
	// visitors.
	const reportOptions = getGraphReportArgs( {
		startDate: '2025-01-14',
		endDate: '2025-01-16',
	} );

	/**
	 * Stores the day the Analytics property was created.
	 *
	 * The time is midday, because a time zone can move midnight to the day
	 * before or the day after.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} date The day the property was created, as `YYYY-MM-DD`.
	 * @return {void}
	 */
	function providePropertyCreateTime( date: string ) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( `${ date }T12:00:00` );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		// `last-3-days` against the `2025-01-16` reference date covers
		// `2025-01-14`, `2025-01-15`, and `2025-01-16`.
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-01-16' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-3-days' );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		mockGoogleChart.mockClear();
	} );

	/**
	 * Waits for the chart to render, then reads the props it received.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The props the chart last received.
	 */
	async function getLastChartProps() {
		await waitFor( () => expect( mockGoogleChart ).toHaveBeenCalled() );

		const { calls } = mockGoogleChart.mock;

		return calls[ calls.length - 1 ][ 0 ];
	}

	it( 'draws one point for each day the report returns', async () => {
		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		const { data } = await getLastChartProps();

		expect( data.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 14 ), 55 ],
			[ new Date( 2025, 0, 15 ), 14 ],
			[ new Date( 2025, 0, 16 ), 3 ],
		] );
	} );

	it( 'labels the horizontal axis from the second day of the range', async () => {
		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		const { options } = await getLastChartProps();

		expect( options.hAxis.ticks ).toEqual( [
			new Date( 2025, 0, 15 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'runs the value axis from 0 to 100 for a range with no visitors', async () => {
		render(
			<TrafficChart
				report={ { totals: [ { metricValues: [ { value: '0' } ] } ] } }
			/>,
			{ registry }
		);

		const { options } = await getLastChartProps();

		expect( options.vAxis.viewWindow ).toEqual( { min: 0, max: 100 } );
	} );

	it( 'draws a flat line across the selected range when it has no visitors', async () => {
		render(
			<TrafficChart
				report={ { totals: [ { metricValues: [ { value: '0' } ] } ] } }
			/>,
			{ registry }
		);

		const { data, options } = await getLastChartProps();

		expect( data.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 15 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( options.hAxis.ticks ).toEqual( [
			new Date( 2025, 0, 15 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'draws a flat line at zero when the chart gets no report', async () => {
		render( <TrafficChart />, { registry } );

		const { data, options } = await getLastChartProps();

		expect( data.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 15 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( options.vAxis.viewWindow ).toEqual( { min: 0, max: 100 } );
	} );

	it( 'sets no maximum on the value axis for a range that has visitors', async () => {
		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		const { options } = await getLastChartProps();

		expect( options.vAxis.viewWindow ).toEqual( { min: 0 } );
	} );

	it( 'draws a line chart in #462083', async () => {
		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		const { chartType, options } = await getLastChartProps();

		expect( chartType ).toBe( 'LineChart' );
		expect( options.colors ).toEqual( [ '#462083' ] );
		expect( options.series[ 0 ].color ).toBe( '#462083' );
		expect( options.crosshair.color ).toBe( '#462083' );
	} );

	it( 'draws a #b8bdb9 line along the right edge of the chart area', async () => {
		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		const { options } = await getLastChartProps();

		expect( options.hAxis.baseline ).toEqual( new Date( 2025, 0, 16 ) );
		expect( options.hAxis.baselineColor ).toBe( '#b8bdb9' );
	} );

	it( 'shows the "Last 3 days traffic" legend label beside a line in the chart color', async () => {
		const { getByRole, waitForRegistry } = render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		await waitForRegistry();

		const legendItem = getByRole( 'listitem' );

		expect( legendItem ).toHaveTextContent( 'Last 3 days traffic' );
		expect(
			legendItem.querySelector(
				'.googlesitekit-traffic-overview__chart-legend-line'
			)
		).toHaveStyle( { backgroundColor: '#462083' } );
	} );

	it( 'marks the day the Analytics property was created when that day is inside the range', async () => {
		providePropertyCreateTime( '2025-01-14' );

		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toEqual( [
			{
				date: '2025-01-14',
				text: 'Google Analytics property created',
			},
		] );
	} );

	it( 'draws no marker when the Analytics property was created before the range', async () => {
		providePropertyCreateTime( '2024-11-02' );

		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toBeUndefined();
	} );

	it( 'draws no marker on a view-only dashboard', async () => {
		providePropertyCreateTime( '2025-01-14' );

		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toBeUndefined();
	} );

	it( 'reads every day and its visitors to a screen reader', async () => {
		const { container, waitForRegistry } = render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		await waitForRegistry();

		const lines = Array.from(
			container.querySelectorAll( '.screen-reader-text' )
		).map( ( line ) => line.textContent );

		expect( lines ).toEqual( [
			'January 14, 2025: 55 visitors',
			'January 15, 2025: 14 visitors',
			'January 16, 2025: 3 visitors',
		] );
	} );

	it( 'reads a day with one visitor in the singular', async () => {
		const { getByText, waitForRegistry } = render(
			<TrafficChart
				report={ {
					rows: [
						{
							dimensionValues: [ { value: '20250114' } ],
							metricValues: [ { value: '1' } ],
						},
					],
				} }
			/>,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getByText( 'January 14, 2025: 1 visitor' )
		).toBeInTheDocument();
	} );

	it( "reads the property-creation marker's day and label to a screen reader", async () => {
		providePropertyCreateTime( '2025-01-14' );

		const { getByText, waitForRegistry } = render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getByText(
				'Google Analytics property created on January 14, 2025.'
			)
		).toBeInTheDocument();
	} );

	it( 'does not read the property-creation marker to a screen reader when the property was created before the range', async () => {
		providePropertyCreateTime( '2024-11-02' );

		const { queryByText, waitForRegistry } = render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		await waitForRegistry();

		expect(
			queryByText(
				'Google Analytics property created on November 2, 2024.'
			)
		).not.toBeInTheDocument();
	} );

	it( 'gives the chart no click handler', async () => {
		render(
			<TrafficChart
				report={ getAnalytics4MockResponse( reportOptions ) }
			/>,
			{ registry }
		);

		const { onSelect, chartEvents } = await getLastChartProps();

		// With no `onSelect` and no `chartEvents`, `GoogleChart` adds no click
		// handler of its own.
		expect( onSelect ).toBeUndefined();
		expect( chartEvents ).toBeUndefined();
	} );
} );
