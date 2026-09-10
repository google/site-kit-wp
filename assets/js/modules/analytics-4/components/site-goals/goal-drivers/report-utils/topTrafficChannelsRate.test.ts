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
import {
	buildTopTrafficChannelsRateReportOptions,
	mapTopTrafficChannelsRateRows,
} from './topTrafficChannelsRate';

function makeRow( dimensionValue: string, ...metricValues: string[] ) {
	return {
		dimensionValues: [ { value: dimensionValue } ],
		metricValues: metricValues.map( ( value ) => ( { value } ) ),
	};
}

describe( 'buildTopTrafficChannelsRateReportOptions', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	it( 'should return undefined without a primary event', () => {
		expect(
			buildTopTrafficChannelsRateReportOptions( {
				dates,
				primaryEvent: undefined,
				limit: 6,
			} )
		).toBeUndefined();
	} );

	it( 'should return undefined without dates', () => {
		expect(
			buildTopTrafficChannelsRateReportOptions( {
				dates: undefined,
				primaryEvent: 'purchase',
				limit: 6,
			} )
		).toBeUndefined();
	} );

	it( 'should request both eventCount and sessions', () => {
		const options = buildTopTrafficChannelsRateReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect( options?.metrics ).toEqual( [
			{ name: 'eventCount' },
			{ name: 'sessions' },
		] );
	} );

	it( 'should append the given context to the reportID, and omit it otherwise', () => {
		const withoutContext = buildTopTrafficChannelsRateReportOptions( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );
		const withContext = buildTopTrafficChannelsRateReportOptions( {
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

describe( 'mapTopTrafficChannelsRateRows', () => {
	it( "should map each row to that channel's own rate, not a share of the total", () => {
		const rows = [
			makeRow( 'Organic Search', '3', '10' ),
			makeRow( 'Direct', '1', '20' ),
		];

		expect( mapTopTrafficChannelsRateRows( rows ) ).toEqual( [
			{ label: 'Organic Search', value: '30%' },
			{ label: 'Direct', value: '5%' },
		] );
	} );

	it( 'should return a 0% value rather than dividing by zero when sessions is zero', () => {
		expect(
			mapTopTrafficChannelsRateRows( [ makeRow( 'Direct', '3', '0' ) ] )
		).toEqual( [ { label: 'Direct', value: '0%' } ] );
	} );
} );
