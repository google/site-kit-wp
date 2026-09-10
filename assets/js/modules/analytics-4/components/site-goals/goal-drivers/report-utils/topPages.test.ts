/**
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
import { buildTopPagesReportOptions, mapTopPagesRows } from './topPages';

function makeRow( dimensionValue: string, ...metricValues: string[] ) {
	return {
		dimensionValues: [ { value: dimensionValue } ],
		metricValues: metricValues.map( ( value ) => ( { value } ) ),
	};
}

describe( 'buildTopPagesReportOptions', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	it( 'should return undefined without a primary event', () => {
		expect(
			buildTopPagesReportOptions( {
				dates,
				primaryEvent: undefined,
				limit: 6,
			} )
		).toBeUndefined();
	} );

	it( 'should request the pagePath and eventName dimensions', () => {
		const options = buildTopPagesReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect( options?.dimensions ).toEqual( [ 'pagePath', 'eventName' ] );
	} );

	it( 'should append the given context to the reportID, and omit it otherwise', () => {
		const withoutContext = buildTopPagesReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );
		const withContext = buildTopPagesReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
			context: 'ecommerce',
		} );

		expect( withContext?.reportID ).toBe(
			`${ withoutContext?.reportID }_ecommerce`
		);
	} );
} );

describe( 'mapTopPagesRows', () => {
	it( 'should map rows to a raw event count rather than a share of the total', () => {
		const rows = [ makeRow( '/blog/post', '42' ) ];

		expect( mapTopPagesRows( rows ) ).toEqual( [
			{ label: '/blog/post', value: '42', pagePath: '/blog/post' },
		] );
	} );
} );
