/**
 * `reportOptions` unit tests.
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
import * as fixtures from '@/js/modules/pagespeed-insights/datastore/__fixtures__';
import {
	CATEGORY_AVERAGE,
	CATEGORY_FAST,
	CATEGORY_SLOW,
} from '@/js/modules/pagespeed-insights/util/constants';
import { extractFieldMetrics, extractLabMetrics } from './reportMetrics';

describe( 'extractLabMetrics', () => {
	it( 'returns displayValue, score, and category for each lab metric', () => {
		const result = extractLabMetrics( fixtures.pagespeedMobile );

		// Lighthouse uses U+00A0 (no-break space) between the number and unit.
		expect( result.largestContentfulPaint ).toMatchObject( {
			displayValue: '1.5 s',
			score: 0.75,
			category: CATEGORY_AVERAGE,
		} );
		expect( result.cumulativeLayoutShift ).toMatchObject( {
			displayValue: '0',
			score: 1,
			category: CATEGORY_FAST,
		} );
		expect( result.totalBlockingTime ).toMatchObject( {
			displayValue: '90 ms',
			score: 0.3,
			category: CATEGORY_SLOW,
		} );
	} );

	it( 'returns zero-value defaults when report audits are missing', () => {
		const result = extractLabMetrics( {} );

		expect( result.largestContentfulPaint.displayValue ).toBe( '0' );
		expect( result.largestContentfulPaint.score ).toBe( 0 );
		expect( result.largestContentfulPaint.category ).toBe( CATEGORY_SLOW );
		expect( result.cumulativeLayoutShift.displayValue ).toBe( '0' );
		expect( result.totalBlockingTime.displayValue ).toBe( '0' );
	} );

	it( 'returns zero-value defaults when report is null', () => {
		const result = extractLabMetrics( null );

		expect( result.largestContentfulPaint.displayValue ).toBe( '0' );
	} );
} );

describe( 'extractFieldMetrics', () => {
	it( 'returns formatted display values and lowercase categories from the fixture', () => {
		const result = extractFieldMetrics( fixtures.pagespeedMobile );

		expect( result ).not.toBeNull();
		// LCP: percentile=2600 → 2.6 s
		expect( result?.largestContentfulPaint?.displayValue ).toBe( '2.6 s' );
		expect( result?.largestContentfulPaint?.category ).toBe(
			CATEGORY_AVERAGE
		);
		// CLS: percentile=30 → 0.30
		expect( result?.cumulativeLayoutShift?.displayValue ).toBe( '0.30' );
		expect( result?.cumulativeLayoutShift?.category ).toBe( CATEGORY_SLOW );
		// INP: percentile=295 → 295 ms
		expect( result?.interactionToNextPaint?.displayValue ).toBe( '295 ms' );
		expect( result?.interactionToNextPaint?.category ).toBe(
			CATEGORY_AVERAGE
		);
	} );

	it( 'returns null when loadingExperience metrics are absent', () => {
		expect( extractFieldMetrics( {} ) ).toBeNull();
		expect( extractFieldMetrics( null ) ).toBeNull();
	} );

	it( 'extracts present metrics independently when INP is missing', () => {
		const reportMissingINP = {
			loadingExperience: {
				metrics: {
					LARGEST_CONTENTFUL_PAINT_MS: {
						percentile: 2600,
						category: 'AVERAGE',
					},
					CUMULATIVE_LAYOUT_SHIFT_SCORE: {
						percentile: 30,
						category: 'SLOW',
					},
					// INTERACTION_TO_NEXT_PAINT intentionally omitted — LCP and
					// CLS must still resolve independently.
				},
			},
		};

		const result = extractFieldMetrics( reportMissingINP );

		expect( result?.largestContentfulPaint?.displayValue ).toBe( '2.6 s' );
		expect( result?.cumulativeLayoutShift?.displayValue ).toBe( '0.30' );
		expect( result?.interactionToNextPaint ).toBeNull();
	} );
} );
