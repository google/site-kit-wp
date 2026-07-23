/**
 * Key Metrics widgets metadata tests.
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
import { KM_ANALYTICS_NEW_VISITORS } from '@/js/googlesitekit/datastore/user/constants';
import { numFmt } from '@/js/util';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * Builds a registry whose `fetchGetReport` resolves with the given report, so
 * the New Visitors `getTileData` can be exercised against a report fixture.
 *
 * @since 1.184.0
 *
 * @param {Object} report The report response to resolve.
 * @return {Object} A mock registry.
 */
function registryReturning( report ) {
	const fetchGetReport = jest.fn( () =>
		Promise.resolve( { response: report } )
	);
	return { dispatch: jest.fn( () => ( { fetchGetReport } ) ) };
}

/**
 * Loads the New Visitors tile data against the given report fixture.
 *
 * @since 1.184.0
 *
 * @param {Object} report The report response the tile fetches.
 * @return {Promise<Object|null>} The resolved tile data.
 */
function loadNewVisitorsTile( report ) {
	return KEY_METRICS_WIDGETS[ KM_ANALYTICS_NEW_VISITORS ].pdfTile.getTileData(
		{
			registry: registryReturning( report ),
			dates: DATES,
			signal: new AbortController().signal,
		}
	);
}

describe( 'KEY_METRICS_WIDGETS pdfTile', () => {
	it( 'defines a pdfTile config for the New Visitors metric', () => {
		const { pdfTile } = KEY_METRICS_WIDGETS[ KM_ANALYTICS_NEW_VISITORS ];

		expect( pdfTile ).toBeDefined();
		expect( pdfTile.TileComponent ).toBeDefined();
		expect( typeof pdfTile.getTileData ).toBe( 'function' );
	} );

	it( 'does not define a pdfTile config for any other metric', () => {
		Object.entries( KEY_METRICS_WIDGETS )
			.filter( ( [ slug ] ) => slug !== KM_ANALYTICS_NEW_VISITORS )
			.forEach( ( [ , entry ] ) => {
				expect( entry.pdfTile ).toBeUndefined();
			} );
	} );

	describe( 'New Visitors getTileData', () => {
		it( 'reads the prominent value from the new visitors row, not the total, and the change from the totals', async () => {
			// New visitors is 500 for the current period; the total (1,200) is
			// only used for the change against the previous total (1,000).
			const report = {
				rows: [
					{
						dimensionValues: [
							{ value: 'new' },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '500' } ],
					},
					{
						dimensionValues: [
							{ value: 'returning' },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '700' } ],
					},
				],
				totals: [
					{ metricValues: [ { value: '1200' } ] },
					{ metricValues: [ { value: '1000' } ] },
				],
			};

			const data = await loadNewVisitorsTile( report );

			// The value is the new visitors count, not the 1,200 total.
			expect( data.value ).toBe( numFmt( 500 ) );
			expect( data.value ).not.toBe( numFmt( 1200 ) );
			// The total rose 1,000 -> 1,200, so the change is positive.
			expect( data.isNegative ).toBe( false );
			expect( data.change ).toEqual( expect.stringContaining( '20' ) );
			// The subtext reads the total visitors, matching the dashboard tile.
			expect( data.subtext ).toContain(
				numFmt( 1200, { style: 'decimal' } )
			);
			expect( data.subtext ).toContain( 'total visitors' );
		} );

		it( 'marks the change negative from the totals even when new visitors is high', async () => {
			// New visitors is high (900), but the total fell 1,000 -> 800, so
			// the change must track the totals and read as negative.
			const report = {
				rows: [
					{
						dimensionValues: [
							{ value: 'new' },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '900' } ],
					},
				],
				totals: [
					{ metricValues: [ { value: '800' } ] },
					{ metricValues: [ { value: '1000' } ] },
				],
			};

			const data = await loadNewVisitorsTile( report );

			expect( data.value ).toBe( numFmt( 900 ) );
			expect( data.isNegative ).toBe( true );
		} );

		it( 'falls back to zero for the value when the report has no rows or totals', async () => {
			const data = await loadNewVisitorsTile( {} );

			expect( data.value ).toBe( numFmt( 0 ) );
			expect( data.isNegative ).toBe( false );
		} );
	} );
} );
