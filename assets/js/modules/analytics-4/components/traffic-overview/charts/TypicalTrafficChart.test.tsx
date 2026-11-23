/**
 * Typical Traffic Overview chart tests.
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
import GoogleChart from '@/js/components/GoogleChart';
import { getChartOptions } from '@/js/components/GoogleChart/utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { BREAKPOINT_DESKTOP } from '@/js/hooks/useBreakpoint';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { act, render, waitFor, within } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import { PUBLISHED_POST_TOOLTIP_HIDE_DELAY } from './PublishedPostTooltip';
import TypicalTrafficChart from './TypicalTrafficChart';
import { PUBLISHED_POST_POINT_STYLE } from './typicalTrafficChartOptions';

jest.mock( '@/js/components/GoogleChart', () =>
	jest
		.requireActual( '@tests/js/mock-google-chart-utils' )
		.mockGoogleChartModule()
);

const mockGoogleChart = jest.mocked( GoogleChart );

describe( 'TypicalTrafficChart', () => {
	let registry: WPDataRegistry;

	const dailyTraffic: BenchmarkingDailyTrafficRow[] = [
		{
			date: '2025-01-14',
			visits: 55,
			expectedMin: null,
			expectedMax: null,
		},
		{
			date: '2025-01-15',
			visits: 14,
			expectedMin: null,
			expectedMax: null,
		},
		{ date: '2025-01-16', visits: 3, expectedMin: null, expectedMax: null },
	];

	// Every day of the range, at zero.
	const noVisits: BenchmarkingDailyTrafficRow[] = dailyTraffic.map(
		( day ) => ( { ...day, visits: 0 } )
	);

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

	it( 'should draw one point for each day of the daily traffic', async () => {
		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { data } = await getLastChartProps();

		expect( data.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 14 ), 55 ],
			[ new Date( 2025, 0, 15 ), 14 ],
			[ new Date( 2025, 0, 16 ), 3 ],
		] );
	} );

	it( 'labels the horizontal axis from the second day of the range', async () => {
		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { options } = await getLastChartProps();

		expect( options.hAxis.ticks ).toEqual( [
			new Date( 2025, 0, 15 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'should run the value axis from 0 to 100 for a range with no visits', async () => {
		render( <TypicalTrafficChart dailyTraffic={ noVisits } />, {
			registry,
		} );

		const { options } = await getLastChartProps();

		expect( options.vAxis.viewWindow ).toEqual( { min: 0, max: 100 } );
	} );

	it( 'should draw a flat line across the selected range when it has no visits', async () => {
		render( <TypicalTrafficChart dailyTraffic={ noVisits } />, {
			registry,
		} );

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

	it( 'should draw a flat line at zero when the chart gets no daily traffic', async () => {
		render( <TypicalTrafficChart />, { registry } );

		const { data, options } = await getLastChartProps();

		expect( data.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 15 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( options.vAxis.viewWindow ).toEqual( { min: 0, max: 100 } );
	} );

	it( 'should set no maximum on the value axis for a range that has visits', async () => {
		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { options } = await getLastChartProps();

		expect( options.vAxis.viewWindow ).toEqual( { min: 0 } );
	} );

	it( 'draws a line chart in #462083', async () => {
		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { chartType, options } = await getLastChartProps();

		expect( chartType ).toBe( 'LineChart' );
		expect( options.colors ).toEqual( [ '#462083' ] );
		expect( options.series[ 0 ].color ).toBe( '#462083' );
		expect( options.crosshair.color ).toBe( '#462083' );
	} );

	it( 'draws a #b8bdb9 line along the right edge of the chart area', async () => {
		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { options } = await getLastChartProps();

		expect( options.hAxis.baseline ).toEqual( new Date( 2025, 0, 16 ) );
		expect( options.hAxis.baselineColor ).toBe( '#b8bdb9' );
	} );

	it( 'shows the "Last 3 days traffic" legend label beside a line in the chart color', async () => {
		const { getByRole, waitForRegistry } = render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } />,
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

		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toEqual( [
			{
				date: '2025-01-14',
				text: 'Google Analytics property created',
			},
		] );
	} );

	it( 'should mark the day the Analytics property was created when that day is the last day of the range', async () => {
		providePropertyCreateTime( '2025-01-16' );

		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toEqual( [
			{
				date: '2025-01-16',
				text: 'Google Analytics property created',
			},
		] );
	} );

	it( 'draws no marker when the Analytics property was created before the range', async () => {
		providePropertyCreateTime( '2024-11-02' );

		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toBeUndefined();
	} );

	it( 'should mark the day the Analytics property was created on a view-only dashboard, and read it to a screen reader', async () => {
		providePropertyCreateTime( '2025-01-14' );

		const { getByText } = render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toEqual( [
			{
				date: '2025-01-14',
				text: 'Google Analytics property created',
			},
		] );
		expect(
			getByText(
				'Google Analytics property created on January 14, 2025.'
			)
		).toBeInTheDocument();
	} );

	it( 'should draw no marker on a view-only dashboard when the Analytics property creation time is not known', async () => {
		// The setting is `0` until Site Kit stores the property's creation time.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { propertyCreateTime: 0 } );

		const { queryByText } = render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		const { dateMarkers } = await getLastChartProps();

		expect( dateMarkers ).toBeUndefined();
		expect(
			queryByText( /Google Analytics property created/ )
		).not.toBeInTheDocument();
	} );

	it( 'should read every day and its visits to a screen reader', async () => {
		const { container, waitForRegistry } = render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } />,
			{ registry }
		);

		await waitForRegistry();

		const lines = Array.from(
			container.querySelectorAll( '.screen-reader-text' )
		).map( ( line ) => line.textContent );

		expect( lines ).toEqual( [
			'January 14, 2025: 55 visits',
			'January 15, 2025: 14 visits',
			'January 16, 2025: 3 visits',
		] );
	} );

	it( 'should read a day with one visit in the singular', async () => {
		const { getByText, waitForRegistry } = render(
			<TypicalTrafficChart
				dailyTraffic={ [
					{
						date: '2025-01-14',
						visits: 1,
						expectedMin: null,
						expectedMax: null,
					},
				] }
			/>,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( 'January 14, 2025: 1 visit' ) ).toBeInTheDocument();
	} );

	it( "reads the property-creation marker's day and label to a screen reader", async () => {
		providePropertyCreateTime( '2025-01-14' );

		const { getByText, waitForRegistry } = render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } />,
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
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			queryByText(
				'Google Analytics property created on November 2, 2024.'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should read no day to a screen reader while the daily traffic loads', async () => {
		const { container, waitForRegistry } = render(
			<TypicalTrafficChart loaded={ false } />,
			{ registry }
		);

		await waitForRegistry();

		const { loaded } = await getLastChartProps();

		expect( loaded ).toBe( false );
		expect(
			container.querySelectorAll( '.screen-reader-text' )
		).toHaveLength( 0 );
	} );

	it( 'should draw a flat line at zero while the property is gathering data, even though the daily traffic has visits', async () => {
		render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } gatheringData />,
			{
				registry,
			}
		);

		const { data, options } = await getLastChartProps();

		expect( data.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 15 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( options.vAxis.viewWindow ).toEqual( { min: 0, max: 100 } );
	} );

	it( 'should label every day of the range while the property is gathering data', async () => {
		registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );

		render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } gatheringData />,
			{
				registry,
			}
		);

		const { options } = await getLastChartProps();

		expect( options.hAxis.viewWindow ).toEqual( {
			min: new Date( 2025, 0, 10 ),
			max: new Date( 2025, 0, 16 ),
		} );
		expect( options.hAxis.ticks ).toEqual( [
			new Date( 2025, 0, 11 ),
			new Date( 2025, 0, 12 ),
			new Date( 2025, 0, 13 ),
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 15 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'should keep the date labels once the chart has extended the options for the gathering-data state', async () => {
		registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );

		render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } gatheringData />,
			{
				registry,
			}
		);

		const { options } = await getLastChartProps();

		// `getChartOptions()` lives in a JavaScript module, so its return type
		// is `Object`.
		const { hAxis } = getChartOptions( options, {
			gatheringData: true,
			chartType: 'LineChart',
			startDate: '2025-01-10',
			endDate: '2025-01-16',
			breakpoint: BREAKPOINT_DESKTOP,
		} ) as { hAxis: { ticks?: Date[] } };

		expect( hAxis.ticks ).toEqual( options.hAxis.ticks );
	} );

	it( 'should set no horizontal view window once the property has data', async () => {
		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { options } = await getLastChartProps();

		expect( options.hAxis.viewWindow ).toBeUndefined();
	} );

	it( 'reads no day to a screen reader while the property is gathering data', async () => {
		const { container, waitForRegistry } = render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } gatheringData />,
			{ registry }
		);

		await waitForRegistry();

		const { gatheringData } = await getLastChartProps();

		expect( gatheringData ).toBe( true );
		expect(
			container.querySelectorAll( '.screen-reader-text' )
		).toHaveLength( 0 );
	} );

	it( 'sizes the placeholder to cover the chart and its legend', async () => {
		render( <TypicalTrafficChart loaded={ false } />, { registry } );

		const { height, loadingHeight } = await getLastChartProps();

		expect( height ).toBe( '256px' );
		expect( loadingHeight ).toBe( '276px' );
	} );

	it( 'should show no legend while the daily traffic loads', async () => {
		const { queryByRole, waitForRegistry } = render(
			<TypicalTrafficChart loaded={ false } />,
			{ registry }
		);

		await waitForRegistry();

		expect( queryByRole( 'listitem' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the legend while the property is gathering data', async () => {
		const { getByRole, waitForRegistry } = render(
			<TypicalTrafficChart dailyTraffic={ dailyTraffic } gatheringData />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByRole( 'listitem' ) ).toHaveTextContent(
			'Last 3 days traffic'
		);
	} );

	it( 'gives the chart no click handler', async () => {
		render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
			registry,
		} );

		const { onSelect, chartEvents } = await getLastChartProps();

		// With no `onSelect` and no `chartEvents`, `GoogleChart` adds no click
		// handler of its own.
		expect( onSelect ).toBeUndefined();
		expect( chartEvents ).toBeUndefined();
	} );

	describe( 'typical traffic range and published posts', () => {
		// Every day has a typical range, as the band covers the whole range or
		// none of it.
		const dailyTrafficWithRange = dailyTraffic.map( ( day ) => ( {
			...day,
			expectedMin: 10,
			expectedMax: 30,
		} ) );

		const publishedPosts = [
			{ date: '2025-01-15', title: 'Ice cream is good for your health' },
			{ date: '2025-01-15', title: 'Eat ice cream every day' },
		];

		/**
		 * Reads the text of each line the chart reads to a screen reader.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Element} container The element the chart rendered into.
		 * @return {Array.<string>} The text of each line, in order.
		 */
		function getScreenReaderLines( container: Element ) {
			return Array.from(
				container.querySelectorAll( '.screen-reader-text' )
			).map( ( line ) => line.textContent );
		}

		it( 'should fill the typical range in #e3d1ff at half opacity, with no edge lines', async () => {
			render(
				<TypicalTrafficChart dailyTraffic={ dailyTrafficWithRange } />,
				{
					registry,
				}
			);

			const { data, options } = await getLastChartProps();

			expect( data[ 2 ] ).toEqual( [
				new Date( 2025, 0, 15 ),
				14,
				10,
				30,
				'14',
			] );
			expect( options.intervals ).toEqual( {
				style: 'area',
				color: '#e3d1ff',
				fillOpacity: 0.5,
				lineWidth: 0,
			} );
		} );

		it( 'should keep the line #462083 and 3px wide with the typical range and the posts', async () => {
			render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTrafficWithRange }
					publishedPosts={ publishedPosts }
				/>,
				{ registry }
			);

			const { options } = await getLastChartProps();

			expect( options.colors ).toEqual( [ '#462083' ] );
			expect( options.series ).toEqual( {
				0: { color: '#462083', lineWidth: 3, targetAxisIndex: 1 },
			} );
		} );

		it( 'should mark a day with published posts with one dot on the line', async () => {
			render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTraffic }
					publishedPosts={ publishedPosts }
				/>,
				{ registry }
			);

			const { data } = await getLastChartProps();

			expect( data.slice( 1 ) ).toEqual( [
				[ new Date( 2025, 0, 14 ), 55, null ],
				[ new Date( 2025, 0, 15 ), 14, PUBLISHED_POST_POINT_STYLE ],
				[ new Date( 2025, 0, 16 ), 3, null ],
			] );
		} );

		it( 'should end the value axis above the typical range for a range with no visits', async () => {
			render(
				<TypicalTrafficChart
					dailyTraffic={ noVisits.map( ( day ) => ( {
						...day,
						expectedMin: 100,
						expectedMax: 300,
					} ) ) }
				/>,
				{ registry }
			);

			const { options } = await getLastChartProps();

			expect( options.vAxis.viewWindow ).toEqual( { min: 0 } );
		} );

		it( 'should list the "Typical traffic range" and "Published post" legend items after the traffic item', async () => {
			const { getAllByRole, waitForRegistry } = render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTrafficWithRange }
					publishedPosts={ publishedPosts }
					bandReferenceDays={ 83 }
				/>,
				{ registry }
			);

			await waitForRegistry();

			const [ trafficItem, rangeItem, postItem, ...otherItems ] =
				getAllByRole( 'listitem' );

			expect( trafficItem ).toHaveTextContent( 'Last 3 days traffic' );

			expect( rangeItem ).toHaveTextContent( 'Typical traffic range' );
			expect(
				rangeItem.querySelector(
					'.googlesitekit-traffic-overview__chart-legend-area'
				)
			).toHaveStyle( { backgroundColor: '#e3d1ff' } );
			expect(
				within( rangeItem ).getByRole( 'button', {
					name: /^Site Kit estimates a typical range from your traffic history, .* Based on 11 weeks of your traffic\. Learn more/,
				} )
			).toBeInTheDocument();
			expect(
				within( rangeItem ).getByText( 'Beta' )
			).toBeInTheDocument();

			expect( postItem ).toHaveTextContent( 'Published post' );
			expect(
				postItem.querySelector(
					'.googlesitekit-traffic-overview__chart-legend-dot'
				)
			).toHaveStyle( { backgroundColor: '#a983e6' } );

			expect( otherItems ).toHaveLength( 0 );
		} );

		it( 'should mention the same time last year in the "Typical traffic range" tooltip once the history reaches it', async () => {
			const { getByRole, waitForRegistry } = render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTrafficWithRange }
					bandReferenceDays={ 365 }
					lastYearAvailable
				/>,
				{ registry }
			);

			await waitForRegistry();

			expect(
				getByRole( 'button', {
					name: /Based on 52 weeks of your traffic, including the same time last year\. Learn more/,
				} )
			).toBeInTheDocument();
		} );

		it( 'should show no tooltip on the "Typical traffic range" legend item without the days of traffic the band is fitted on', async () => {
			const { getAllByRole, waitForRegistry } = render(
				<TypicalTrafficChart dailyTraffic={ dailyTrafficWithRange } />,
				{ registry }
			);

			await waitForRegistry();

			const [ , rangeItem ] = getAllByRole( 'listitem' );

			expect( rangeItem ).toHaveTextContent( 'Typical traffic range' );
			expect( within( rangeItem ).queryByRole( 'button' ) ).toBeNull();
		} );

		it( 'should list only the traffic legend item when no day the chart plots has a typical range or a post', async () => {
			const { getAllByRole, waitForRegistry } = render(
				<TypicalTrafficChart
					// Every day has null bounds.
					dailyTraffic={ dailyTraffic }
					publishedPosts={ [
						{
							date: '2025-01-17',
							title: 'Ice cream is good for your health',
						},
					] }
				/>,
				{ registry }
			);

			await waitForRegistry();

			const items = getAllByRole( 'listitem' );

			expect( items ).toHaveLength( 1 );
			expect( items[ 0 ] ).toHaveTextContent( 'Last 3 days traffic' );
		} );

		it( "should read each day's typical range, and each post after its day, to a screen reader", async () => {
			const { container, waitForRegistry } = render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTrafficWithRange }
					publishedPosts={ publishedPosts }
				/>,
				{ registry }
			);

			await waitForRegistry();

			expect( getScreenReaderLines( container ) ).toEqual( [
				'January 14, 2025: 55 visits, typical range 10 to 30',
				'January 15, 2025: 14 visits, typical range 10 to 30',
				'Post published on January 15, 2025: Ice cream is good for your health',
				'Post published on January 15, 2025: Eat ice cream every day',
				'January 16, 2025: 3 visits, typical range 10 to 30',
			] );
		} );

		it( 'should draw the bounds of each day as they are, and read them to a screen reader with their decimals', async () => {
			const { container, waitForRegistry } = render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTraffic.map( ( day ) => ( {
						...day,
						expectedMin: 10.4,
						expectedMax: 31.6,
					} ) ) }
				/>,
				{ registry }
			);

			await waitForRegistry();

			const { data } = await getLastChartProps();

			expect( data.slice( 1 ) ).toEqual( [
				[ new Date( 2025, 0, 14 ), 55, 10.4, 31.6, '55' ],
				[ new Date( 2025, 0, 15 ), 14, 10.4, 31.6, '14' ],
				[ new Date( 2025, 0, 16 ), 3, 10.4, 31.6, '3' ],
			] );
			expect( getScreenReaderLines( container ) ).toEqual( [
				'January 14, 2025: 55 visits, typical range 10.4 to 31.6',
				'January 15, 2025: 14 visits, typical range 10.4 to 31.6',
				'January 16, 2025: 3 visits, typical range 10.4 to 31.6',
			] );
		} );

		it( 'should neither draw the typical range nor list it in the legend or read it to a screen reader when a day has none', async () => {
			const { container, getAllByRole, waitForRegistry } = render(
				<TypicalTrafficChart
					// The band covers the whole range or none of it, so the
					// first day without a typical range leaves it out.
					dailyTraffic={ dailyTrafficWithRange.map( ( day, index ) =>
						index === 0
							? { ...day, expectedMin: null, expectedMax: null }
							: day
					) }
				/>,
				{ registry }
			);

			await waitForRegistry();

			const { data } = await getLastChartProps();

			expect( data[ 0 ] ).toHaveLength( 2 );
			expect( getAllByRole( 'listitem' ) ).toHaveLength( 1 );
			expect( getScreenReaderLines( container ) ).toEqual( [
				'January 14, 2025: 55 visits',
				'January 15, 2025: 14 visits',
				'January 16, 2025: 3 visits',
			] );
		} );

		it( 'should draw neither the typical range nor the posts, nor list them in the legend, while the property is gathering data', async () => {
			const { container, getAllByRole, waitForRegistry } = render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTraffic.map( ( day ) => ( {
						...day,
						expectedMin: 10,
						expectedMax: 30,
					} ) ) }
					publishedPosts={ [
						{
							date: '2025-01-14',
							title: 'Ice cream is good for your health',
						},
					] }
					gatheringData
				/>,
				{ registry }
			);

			await waitForRegistry();

			const { data } = await getLastChartProps();

			expect( data[ 0 ] ).toHaveLength( 2 );
			expect( getAllByRole( 'listitem' ) ).toHaveLength( 1 );
			expect( getScreenReaderLines( container ) ).toEqual( [] );
		} );
	} );

	describe( 'published post tooltip', () => {
		const publishedPosts = [
			{
				date: '2025-01-15',
				title: 'Ice cream is good for your health',
				url: 'http://example.com/ice-cream/',
			},
		];

		// A chart that puts each day 10px further right for each day of the
		// month, and each visit 1px higher on the line's value axis.
		const chartWrapper = {
			getChart: () => ( {
				getChartLayoutInterface: () => ( {
					getXLocation: ( date: Date ) => date.getDate() * 10,
					getYLocation: ( value: number, axisIndex?: number ) =>
						axisIndex === 1 ? 200 - value : NaN,
				} ),
			} ),
		};

		afterEach( () => {
			jest.useRealTimers();
		} );

		/**
		 * Finds the open tooltip.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Element} container The element the chart rendered into.
		 * @return {Element|null} The tooltip, or `null` when it's closed.
		 */
		function getTooltip( container: Element ): Element | null {
			return container.querySelector(
				'.googlesitekit-traffic-overview__post-tooltip'
			);
		}

		it( 'should not listen to the pointer when no day the chart plots has a published post', async () => {
			render( <TypicalTrafficChart dailyTraffic={ dailyTraffic } />, {
				registry,
			} );

			const { onMouseOver, onMouseOut } = await getLastChartProps();

			expect( onMouseOver ).toBeUndefined();
			expect( onMouseOut ).toBeUndefined();
		} );

		it( 'should open the tooltip over the dot of a day with a published post when the pointer moves onto the day', async () => {
			const { container, getByRole, getByText } = render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTraffic }
					publishedPosts={ publishedPosts }
				/>,
				{ registry }
			);

			const { onMouseOver } = await getLastChartProps();

			expect( getTooltip( container ) ).toBeNull();

			// The second row of the chart table is `2025-01-15`, with 14 visits.
			act( () =>
				onMouseOver( { row: 1, column: null }, { chartWrapper } )
			);

			expect(
				getByText( 'Ice cream is good for your health' )
			).toBeInTheDocument();
			expect( getByText( 'posted Jan 15' ) ).toBeInTheDocument();
			expect( getByRole( 'link', { name: 'See more' } ) ).toHaveAttribute(
				'href',
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=http%3A%2F%2Fexample.com%2Fice-cream%2F'
			);
			// The dot is at 150px by 186px, and the caret's tip 11px above
			// its middle.
			expect( getTooltip( container ) ).toHaveStyle( {
				left: '150px',
				top: '175px',
			} );
		} );

		it( 'should close the tooltip after a moment when the pointer moves onto a day without a published post', async () => {
			const { container } = render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTraffic }
					publishedPosts={ publishedPosts }
				/>,
				{ registry }
			);

			const { onMouseOver } = await getLastChartProps();

			jest.useFakeTimers();

			act( () =>
				onMouseOver( { row: 1, column: null }, { chartWrapper } )
			);
			act( () =>
				onMouseOver( { row: 2, column: null }, { chartWrapper } )
			);

			expect( getTooltip( container ) ).toBeInTheDocument();

			act( () => {
				jest.advanceTimersByTime( PUBLISHED_POST_TOOLTIP_HIDE_DELAY );
			} );

			expect( getTooltip( container ) ).toBeNull();
		} );

		it( 'should close the tooltip after a moment when the pointer leaves the chart', async () => {
			const { container } = render(
				<TypicalTrafficChart
					dailyTraffic={ dailyTraffic }
					publishedPosts={ publishedPosts }
				/>,
				{ registry }
			);

			const { onMouseOver, onMouseOut } = await getLastChartProps();

			jest.useFakeTimers();

			act( () =>
				onMouseOver( { row: 1, column: null }, { chartWrapper } )
			);
			act( () =>
				onMouseOut( { row: 1, column: null }, { chartWrapper } )
			);

			expect( getTooltip( container ) ).toBeInTheDocument();

			act( () => {
				jest.advanceTimersByTime( PUBLISHED_POST_TOOLTIP_HIDE_DELAY );
			} );

			expect( getTooltip( container ) ).toBeNull();
		} );
	} );
} );
