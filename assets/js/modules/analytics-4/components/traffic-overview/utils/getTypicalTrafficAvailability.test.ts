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
import { getTypicalTrafficAvailability } from './getTypicalTrafficAvailability';

describe( 'getTypicalTrafficAvailability', () => {
	it( 'should show every part while the benchmarking response loads', () => {
		expect( getTypicalTrafficAvailability( undefined ) ).toEqual( {
			rangeTooShort: false,
			keyFactorsAvailable: true,
			insightRequestAllowed: true,
			performanceInsightAvailable: true,
		} );
	} );

	it( 'should read the parts from the availability of the benchmarking response, rather than from its days', () => {
		const response = createBenchmarkingResponse(
			'2025-01-09',
			'2025-02-05'
		);

		// Every day has its typical range, but the response says the range
		// has no part of the view, so the parts follow the response.
		expect(
			getTypicalTrafficAvailability( {
				...response,
				availability: {
					...response.availability,
					rangeTooShort: true,
					keyFactorsAvailable: false,
					insightRequestAllowed: false,
					performanceInsightAvailable: false,
				},
			} )
		).toEqual(
			expect.objectContaining( {
				rangeTooShort: true,
				keyFactorsAvailable: false,
				insightRequestAllowed: false,
				performanceInsightAvailable: false,
			} )
		);
	} );
} );
