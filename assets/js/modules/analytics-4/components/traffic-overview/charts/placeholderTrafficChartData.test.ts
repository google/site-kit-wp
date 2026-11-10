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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { getDateString } from '@/js/util';
import {
	getPlaceholderPublishedPosts,
	getPlaceholderTypicalTrafficRange,
} from './placeholderTrafficChartData';

/**
 * Builds a daily-visitors report with one row for each count, from
 * `2025-01-10` on.
 *
 * @since n.e.x.t
 *
 * @param {Array.<number>} visitors The visitors on each day, oldest first.
 * @return {Object} The report.
 */
function createDailyVisitorsReport( visitors: number[] ): Report {
	return {
		rows: visitors.map( ( value, index ) => ( {
			dimensionValues: [
				{
					value: getDateString(
						new Date( 2025, 0, 10 + index )
					).replace( /-/g, '' ),
				},
			],
			metricValues: [ { value: String( value ) } ],
		} ) ),
	};
}

describe( 'getPlaceholderTypicalTrafficRange', () => {
	it( 'should run each day a quarter below and above the average of the seven days centered on it', () => {
		const range = getPlaceholderTypicalTrafficRange(
			createDailyVisitorsReport( [ 10, 20, 30, 40, 50, 60, 70 ] )
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

	it( 'should keep each range at least 5 visitors either way, and never below 0', () => {
		expect(
			getPlaceholderTypicalTrafficRange(
				createDailyVisitorsReport( [ 8, 8, 8 ] )
			)
		).toEqual( [
			{ date: '2025-01-10', min: 3, max: 13 },
			{ date: '2025-01-11', min: 3, max: 13 },
			{ date: '2025-01-12', min: 3, max: 13 },
		] );

		expect(
			getPlaceholderTypicalTrafficRange(
				createDailyVisitorsReport( [ 0 ] )
			)
		).toEqual( [ { date: '2025-01-10', min: 0, max: 5 } ] );
	} );

	it( 'should give no range without a report', () => {
		expect( getPlaceholderTypicalTrafficRange() ).toEqual( [] );
		expect( getPlaceholderTypicalTrafficRange( { rows: [] } ) ).toEqual(
			[]
		);
	} );
} );

describe( 'getPlaceholderPublishedPosts', () => {
	it( 'should place three posts 12%, 48% and 75% of the way through the days of the report', () => {
		// 28 days, from `2025-01-10` to `2025-02-06`, put the posts on the
		// days at the positions 3, 13 and 20.
		const report = createDailyVisitorsReport( Array( 28 ).fill( 10 ) );

		expect( getPlaceholderPublishedPosts( report ) ).toEqual( [
			{ date: '2025-01-13', title: 'Ice cream is good for your health' },
			{ date: '2025-01-23', title: 'Eat ice cream every day' },
			{ date: '2025-01-30', title: 'The best ice cream shops guide' },
		] );
	} );

	it( 'should give no posts without a report', () => {
		expect( getPlaceholderPublishedPosts() ).toEqual( [] );
		expect( getPlaceholderPublishedPosts( { rows: [] } ) ).toEqual( [] );
	} );
} );
