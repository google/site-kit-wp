/**
 * Key factors steady traffic helper tests.
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
import { KEY_FACTORS_DAILY_CHANGE_THRESHOLD } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { BenchmarkingVisits } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { isSteadyTraffic } from './isSteadyTraffic';

const DAYS = 28;

/**
 * The change over `DAYS` days at which a card's daily change reaches the
 * threshold. The tests derive their changes from it, so they hold for any
 * threshold.
 */
const THRESHOLD_CHANGE = KEY_FACTORS_DAILY_CHANGE_THRESHOLD * DAYS;

/**
 * Gets the visits of a card whose visits changed by the given number.
 *
 * @since n.e.x.t
 *
 * @param {number} change The change in visits, negative for a drop.
 * @return {Object} The card's visits in the selected date range and in the range before it.
 */
function withChange( change: number ): BenchmarkingVisits {
	return { current: 1000 + change, previous: 1000 };
}

describe( 'isSteadyTraffic', () => {
	it( 'should be steady when every card’s visits changed by less than the threshold a day, in either direction', () => {
		expect(
			isSteadyTraffic(
				[
					withChange( THRESHOLD_CHANGE - 1 ),
					withChange( -( THRESHOLD_CHANGE - 1 ) ),
					withChange( 0 ),
				],
				DAYS
			)
		).toBe( true );
	} );

	it.each( [
		[ 'grew', THRESHOLD_CHANGE ],
		[ 'dropped', -THRESHOLD_CHANGE ],
	] )(
		'should not be steady when one card’s visits %s by exactly the threshold a day',
		( _, change ) => {
			expect(
				isSteadyTraffic(
					[ withChange( 1 ), withChange( change ) ],
					DAYS
				)
			).toBe( false );
		}
	);

	it( 'should judge a card by its change a day over the days of the selected date range', () => {
		const keyFactors = [ withChange( THRESHOLD_CHANGE ) ];

		expect( isSteadyTraffic( keyFactors, DAYS ) ).toBe( false );
		// Spread over one more day, the same change is below the threshold.
		expect( isSteadyTraffic( keyFactors, DAYS + 1 ) ).toBe( true );
	} );

	it( 'should not be steady without cards', () => {
		expect( isSteadyTraffic( [], DAYS ) ).toBe( false );
	} );
} );
