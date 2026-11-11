/**
 * Traffic Overview chart placeholder data tests.
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
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getDateString } from '@/js/util';
import {
	getPlaceholderDailyTraffic,
	getPlaceholderPublishedPosts,
	getPlaceholderTypicalTrafficRange,
} from './placeholderTrafficChartData';

/**
 * Builds the daily traffic with one row for each count, from `2025-01-10` on.
 *
 * @since n.e.x.t
 *
 * @param {Array.<number>} visits The visits on each day, oldest first.
 * @return {Array.<Object>} The daily traffic.
 */
function createDailyTraffic( visits: number[] ): BenchmarkingDailyTrafficRow[] {
	return visits.map( ( value, index ) => ( {
		date: getDateString( new Date( 2025, 0, 10 + index ) ),
		visits: value,
	} ) );
}

describe( 'getPlaceholderDailyTraffic', () => {
	it( "should give each day of a 28 day range the design's visits for that day", () => {
		const dailyTraffic = getPlaceholderDailyTraffic(
			'2025-01-09',
			'2025-02-05'
		);

		expect( dailyTraffic ).toHaveLength( 28 );
		expect( dailyTraffic[ 0 ] ).toEqual( {
			date: '2025-01-09',
			visits: 39,
		} );
		// The dip under the first post.
		expect( dailyTraffic[ 3 ] ).toEqual( {
			date: '2025-01-12',
			visits: 25,
		} );
		expect( dailyTraffic[ 27 ] ).toEqual( {
			date: '2025-02-05',
			visits: 152,
		} );
	} );

	it( "should stretch the design's visits over a shorter range, keeping its first and last days", () => {
		const dailyTraffic = getPlaceholderDailyTraffic(
			'2025-01-30',
			'2025-02-05'
		);

		expect( dailyTraffic.map( ( { date } ) => date ) ).toEqual( [
			'2025-01-30',
			'2025-01-31',
			'2025-02-01',
			'2025-02-02',
			'2025-02-03',
			'2025-02-04',
			'2025-02-05',
		] );
		// The second day sits halfway between the design's fifth and sixth
		// days, 42 and 41, so it takes 41.5, rounded to 42.
		expect( dailyTraffic.map( ( { visits } ) => visits ) ).toEqual( [
			39, 42, 38, 71, 76, 128, 152,
		] );
	} );

	it( 'should give one row for each day of a 90 day range', () => {
		// The range takes in the March start of daylight saving time, in the
		// time zones that have it.
		const dailyTraffic = getPlaceholderDailyTraffic(
			'2025-01-01',
			'2025-03-31'
		);
		const dates = dailyTraffic.map( ( { date } ) => date );

		expect( dailyTraffic ).toHaveLength( 90 );
		expect( new Set( dates ).size ).toBe( 90 );
		expect( dailyTraffic[ 0 ] ).toEqual( {
			date: '2025-01-01',
			visits: 39,
		} );
		expect( dailyTraffic[ 89 ] ).toEqual( {
			date: '2025-03-31',
			visits: 152,
		} );
	} );

	it( "should give a range of one day the design's last visits", () => {
		expect(
			getPlaceholderDailyTraffic( '2025-02-05', '2025-02-05' )
		).toEqual( [ { date: '2025-02-05', visits: 152 } ] );
	} );
} );

describe( 'getPlaceholderTypicalTrafficRange', () => {
	it( 'should run each day a quarter below and above the average of the seven days centered on it', () => {
		const range = getPlaceholderTypicalTrafficRange(
			createDailyTraffic( [ 10, 20, 30, 40, 50, 60, 70 ] )
		);

		expect( range ).toHaveLength( 7 );
		// The first day averages itself and the three days after it: 25.
		expect( range[ 0 ] ).toEqual( {
			date: '2025-01-10',
			min: 19,
			max: 31,
		} );
		// The middle day averages all seven days: 40.
		expect( range[ 3 ] ).toEqual( {
			date: '2025-01-13',
			min: 30,
			max: 50,
		} );
		// The last day averages itself and the three days before it: 55.
		expect( range[ 6 ] ).toEqual( {
			date: '2025-01-16',
			min: 41,
			max: 69,
		} );
	} );

	it( 'should keep each range at least 5 visits either way, and never below 0', () => {
		expect(
			getPlaceholderTypicalTrafficRange(
				createDailyTraffic( [ 8, 8, 8 ] )
			)
		).toEqual( [
			{ date: '2025-01-10', min: 3, max: 13 },
			{ date: '2025-01-11', min: 3, max: 13 },
			{ date: '2025-01-12', min: 3, max: 13 },
		] );

		expect(
			getPlaceholderTypicalTrafficRange( createDailyTraffic( [ 0 ] ) )
		).toEqual( [ { date: '2025-01-10', min: 0, max: 5 } ] );
	} );

	it( 'should give no range without daily traffic', () => {
		expect( getPlaceholderTypicalTrafficRange() ).toEqual( [] );
		expect( getPlaceholderTypicalTrafficRange( [] ) ).toEqual( [] );
	} );
} );

describe( 'getPlaceholderPublishedPosts', () => {
	it( 'should place three posts 12%, 48% and 75% of the way through the days of the daily traffic', () => {
		// 28 days, from `2025-01-10` to `2025-02-06`, put the posts on the
		// days at the positions 3, 13 and 20.
		const dailyTraffic = createDailyTraffic( Array( 28 ).fill( 10 ) );

		expect( getPlaceholderPublishedPosts( dailyTraffic ) ).toEqual( [
			{ date: '2025-01-13', title: 'Ice cream is good for your health' },
			{ date: '2025-01-23', title: 'Eat ice cream every day' },
			{ date: '2025-01-30', title: 'The best ice cream shops guide' },
		] );
	} );

	it( 'should give no posts without daily traffic', () => {
		expect( getPlaceholderPublishedPosts() ).toEqual( [] );
		expect( getPlaceholderPublishedPosts( [] ) ).toEqual( [] );
	} );
} );
