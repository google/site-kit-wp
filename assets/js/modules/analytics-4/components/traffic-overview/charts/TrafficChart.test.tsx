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
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import { createDailyVisitorsReport } from './test-utils';
import TrafficChart from './TrafficChart';

const mockGoogleChart = jest.fn();

// Google Charts shows nothing under Jest, so `GoogleChartStub` records the
// props a test reads.
jest.mock( '@/js/components/GoogleChart', () => {
	return function GoogleChartStub( props: Record< string, unknown > ) {
		mockGoogleChart( props );
		return <div className="googlesitekit-chart" />;
	};
} );

describe( 'TrafficChart', () => {
	let registry: WPDataRegistry;

	/**
	 * Stores the day the property was created.
	 *
	 * `setPropertyCreateTime` takes a full time string. The time is midday,
	 * because midnight lands on a different day in some time zones.
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
		// `last-3-days` against this reference date covers 2025-01-14,
		// 2025-01-15, and 2025-01-16.
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

	it( 'shows one point per day the report returns', async () => {
		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [
					[ '2025-01-14', 40 ],
					[ '2025-01-15', 12 ],
					[ '2025-01-16', 7 ],
				] ) }
			/>,
			{ registry }
		);

		const { chartType, data } = await getLastChartProps();

		expect( chartType ).toBe( 'LineChart' );
		expect( data.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 14 ), 40 ],
			[ new Date( 2025, 0, 15 ), 12 ],
			[ new Date( 2025, 0, 16 ), 7 ],
		] );
	} );

	it( 'labels the horizontal axis from the second day of the range', async () => {
		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [
					[ '2025-01-14', 40 ],
					[ '2025-01-15', 12 ],
					[ '2025-01-16', 7 ],
				] ) }
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
		// A range with no traffic comes back with a zero total and no rows.
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

	it( 'draws the range flat at zero before the report arrives', async () => {
		render( <TrafficChart />, { registry } );

		const { data, options } = await getLastChartProps();

		expect( data.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 15 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( options.vAxis.viewWindow ).toEqual( { min: 0, max: 100 } );
	} );

	it( 'sets no top on the value axis for a range that has visitors', async () => {
		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
			/>,
			{ registry }
		);

		const { options } = await getLastChartProps();

		expect( options.vAxis.viewWindow ).toEqual( { min: 0 } );
	} );

	it( 'shows the line in the design color on the main dashboard', async () => {
		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		const { options } = await getLastChartProps();

		expect( options.colors ).toEqual( [ '#462083' ] );
		expect( options.series[ 0 ].color ).toBe( '#462083' );
		expect( options.crosshair.color ).toBe( '#462083' );
	} );

	it( 'shows the line in the design color on the entity dashboard', async () => {
		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD }
		);

		const { options } = await getLastChartProps();

		expect( options.colors ).toEqual( [ '#462083' ] );
		expect( options.series[ 0 ].color ).toBe( '#462083' );
		expect( options.crosshair.color ).toBe( '#462083' );
	} );

	it( 'shows the line in the design color on the view-only dashboard', async () => {
		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		const { options } = await getLastChartProps();

		expect( options.colors ).toEqual( [ '#462083' ] );
		expect( options.series[ 0 ].color ).toBe( '#462083' );
		expect( options.crosshair.color ).toBe( '#462083' );
	} );

	it( 'keeps the line color when a longer date range is selected', async () => {
		registry.dispatch( CORE_USER ).setDateRange( 'last-90-days' );

		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
			/>,
			{ registry }
		);

		const { options } = await getLastChartProps();

		expect( options.colors ).toEqual( [ '#462083' ] );
		expect( options.series[ 0 ].color ).toBe( '#462083' );
		expect( options.crosshair.color ).toBe( '#462083' );
	} );

	it( 'marks the day the property was created when it falls inside the range', async () => {
		providePropertyCreateTime( '2025-01-14' );

		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
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

	it( 'does not mark the chart when the property was created before the range', async () => {
		providePropertyCreateTime( '2024-11-02' );

		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
			/>,
			{ registry }
		);

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toBeUndefined();
	} );

	it( 'does not mark the chart on a view-only dashboard', async () => {
		providePropertyCreateTime( '2025-01-14' );

		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toBeUndefined();
	} );

	it( 'reads every day and its visitors to a screen reader', async () => {
		const { container, waitForRegistry } = render(
			<TrafficChart
				report={ createDailyVisitorsReport( [
					[ '2025-01-14', 40 ],
					[ '2025-01-15', 12 ],
					[ '2025-01-16', 7 ],
				] ) }
			/>,
			{ registry }
		);

		await waitForRegistry();

		const lines = Array.from(
			container.querySelectorAll( '.screen-reader-text' )
		).map( ( line ) => line.textContent );

		expect( lines ).toEqual( [
			'January 14, 2025: 40 visitors',
			'January 15, 2025: 12 visitors',
			'January 16, 2025: 7 visitors',
		] );
	} );

	it( 'reads a day with one visitor in the singular', async () => {
		const { getByText, waitForRegistry } = render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 1 ] ] ) }
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
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
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
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
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

	it( 'passes no click handler to the chart', async () => {
		render(
			<TrafficChart
				report={ createDailyVisitorsReport( [ [ '2025-01-14', 40 ] ] ) }
			/>,
			{ registry }
		);

		const { onSelect, chartEvents } = await getLastChartProps();

		// With neither prop, `GoogleChart` adds no click handling of its own.
		expect( onSelect ).toBeUndefined();
		expect( chartEvents ).toBeUndefined();
	} );
} );
