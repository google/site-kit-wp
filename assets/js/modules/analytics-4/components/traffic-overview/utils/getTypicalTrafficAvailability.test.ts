/**
 * `getTypicalTrafficAvailability` utility tests.
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
import { createBenchmarkingResponse } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getTypicalTrafficAvailability } from './getTypicalTrafficAvailability';

describe( 'getTypicalTrafficAvailability', () => {
	// The 28 days from `2025-01-09` to `2025-02-05`, after the 28 days from
	// `2024-12-12`.
	const compareStartDate = '2024-12-12';
	const daysInRange = 28;

	/**
	 * Builds a benchmarking response for the 28-day range, with the given
	 * fields in place of the design's.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [fields] Optional. The fields to set.
	 * @return {Object} The decoded response.
	 */
	function createResponse(
		fields: Partial< DecodedBenchmarkingResponse > = {}
	): DecodedBenchmarkingResponse {
		return {
			...createBenchmarkingResponse( '2025-01-09', '2025-02-05' ),
			...fields,
		};
	}

	/**
	 * Builds a benchmarking response for the 28-day range whose days have no
	 * typical range.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [fields] Optional. The fields to set.
	 * @return {Object} The decoded response.
	 */
	function createResponseWithoutBand(
		fields: Partial< DecodedBenchmarkingResponse > = {}
	): DecodedBenchmarkingResponse {
		const response = createResponse( fields );

		return {
			...response,
			dailyTraffic: response.dailyTraffic.map( ( day ) => ( {
				...day,
				expectedMin: null,
				expectedMax: null,
			} ) ),
		};
	}

	it( 'should show every part with a year of history', () => {
		expect(
			getTypicalTrafficAvailability( {
				benchmarkingResponse: createResponse(),
				compareStartDate,
				daysInRange,
			} )
		).toEqual( {
			keyFactorsAvailable: true,
			bandAvailable: true,
			insightRequestAllowed: true,
			performanceInsightAvailable: true,
		} );
	} );

	it( 'should keep every part while the benchmarking response loads, so each keeps its placeholder', () => {
		expect(
			getTypicalTrafficAvailability( {
				benchmarkingResponse: undefined,
				compareStartDate,
				daysInRange,
			} )
		).toEqual( {
			keyFactorsAvailable: true,
			bandAvailable: true,
			insightRequestAllowed: true,
			performanceInsightAvailable: true,
		} );
	} );

	it( 'should have the key factors and the insight request, but not the analysis, without the band', () => {
		// 56 days of history are enough for the key factors, and too few for
		// the band, which needs 111.
		expect(
			getTypicalTrafficAvailability( {
				benchmarkingResponse: createResponseWithoutBand( {
					firstTrafficDate: compareStartDate,
				} ),
				compareStartDate,
				daysInRange,
			} )
		).toEqual( {
			keyFactorsAvailable: true,
			bandAvailable: false,
			insightRequestAllowed: true,
			performanceInsightAvailable: false,
		} );
	} );

	it.each( [
		[
			'the previous range starts the day before the first day with recorded traffic',
			'2024-12-13',
		],
		[ 'the site has no recorded traffic', null ],
	] )(
		'should have neither the key factors nor the insight when %s, band or not',
		( _, firstTrafficDate ) => {
			// A 90-day range gets its band from 173 days of history, before
			// its key factors, which need 180.
			expect(
				getTypicalTrafficAvailability( {
					benchmarkingResponse: createResponse( {
						firstTrafficDate,
					} ),
					compareStartDate,
					daysInRange,
				} )
			).toEqual( {
				keyFactorsAvailable: false,
				bandAvailable: true,
				insightRequestAllowed: false,
				performanceInsightAvailable: false,
			} );
		}
	);

	it( 'should have the key factors when the previous range starts on the first day with recorded traffic', () => {
		expect(
			getTypicalTrafficAvailability( {
				benchmarkingResponse: createResponse( {
					firstTrafficDate: compareStartDate,
				} ),
				compareStartDate,
				daysInRange,
			} ).keyFactorsAvailable
		).toBe( true );
	} );

	it( 'should have neither the key factors nor the insight for a range of fewer than 7 days', () => {
		expect(
			getTypicalTrafficAvailability( {
				benchmarkingResponse: createResponse(),
				compareStartDate,
				daysInRange: 6,
			} )
		).toEqual( {
			keyFactorsAvailable: false,
			bandAvailable: true,
			insightRequestAllowed: false,
			performanceInsightAvailable: false,
		} );
	} );

	it( 'should have no band without daily traffic', () => {
		expect(
			getTypicalTrafficAvailability( {
				benchmarkingResponse: createResponse( { dailyTraffic: [] } ),
				compareStartDate,
				daysInRange,
			} ).bandAvailable
		).toBe( false );
	} );
} );
