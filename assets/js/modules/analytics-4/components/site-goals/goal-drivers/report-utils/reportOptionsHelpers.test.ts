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
	buildGoalDriverTotalReportOptions,
	buildSingleDimensionReportOptionsBuilder,
	withContextSuffix,
} from './reportOptionsHelpers';

describe( 'withContextSuffix', () => {
	it( 'should append the given context to the base reportID', () => {
		expect( withContextSuffix( 'analytics-4_report', 'ecommerce' ) ).toBe(
			'analytics-4_report_ecommerce'
		);
	} );

	it( 'should return the base reportID unchanged when no context is given', () => {
		expect( withContextSuffix( 'analytics-4_report' ) ).toBe(
			'analytics-4_report'
		);
	} );
} );

describe( 'buildSingleDimensionReportOptionsBuilder', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };
	const build = buildSingleDimensionReportOptionsBuilder( 'city', 'cities' );

	it( 'should return undefined without a primary event', () => {
		expect(
			build( { dates, primaryEvent: undefined, limit: 6 } )
		).toBeUndefined();
	} );

	it( 'should return undefined without dates', () => {
		expect(
			build( { dates: undefined, primaryEvent: 'purchase', limit: 6 } )
		).toBeUndefined();
	} );

	it( 'should request the given dimension, metric and row limit', () => {
		const options = build( { dates, primaryEvent: 'purchase', limit: 6 } );

		expect( options?.dimensions ).toEqual( [ 'city' ] );
		expect( options?.metrics ).toEqual( [ { name: 'eventCount' } ] );
		expect( options?.limit ).toBe( 6 );
	} );

	it( 'should scope the report to a breakdown filter when provided', () => {
		const options = build( {
			dates,
			primaryEvent: 'purchase',
			breakdownFilter: { someDimension: 'someValue' },
			limit: 6,
		} );

		expect( options?.dimensionFilters ).toMatchObject( {
			someDimension: 'someValue',
		} );
	} );

	it( 'should append the given context to the reportID, and omit it otherwise', () => {
		const withoutContext = build( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );
		const withContext = build( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
			context: 'ecommerce',
		} );

		expect( withContext?.reportID ).toBe(
			`${ withoutContext?.reportID }_ecommerce`
		);
	} );

	it( 'should exclude "(not set)" rows for the dimension when excludeNotSet is true', () => {
		const buildExcluding = buildSingleDimensionReportOptionsBuilder(
			'city',
			'cities',
			{ excludeNotSet: true }
		);

		const options = buildExcluding( {
			dates,
			primaryEvent: 'purchase',
			limit: 6,
		} );

		expect( options?.dimensionFilters?.city ).toMatchObject( {
			filterType: 'emptyFilter',
			notExpression: true,
		} );
	} );

	it( 'should not exclude "(not set)" rows by default', () => {
		const options = build( { dates, primaryEvent: 'purchase', limit: 6 } );

		expect( options?.dimensionFilters ).not.toHaveProperty( 'city' );
	} );
} );

describe( 'buildGoalDriverTotalReportOptions', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	it( 'should return undefined without a primary event', () => {
		expect(
			buildGoalDriverTotalReportOptions( {
				dates,
				reportIDSuffix: 'top-authors',
			} )
		).toBeUndefined();
	} );

	it( 'should request eventCount with no dimension breakdown or row limit', () => {
		const options = buildGoalDriverTotalReportOptions( {
			dates,
			primaryEvent: 'purchase',
			reportIDSuffix: 'top-authors',
		} );

		expect( options?.metrics ).toEqual( [ { name: 'eventCount' } ] );
		expect( options ).not.toHaveProperty( 'dimensions' );
		expect( options ).not.toHaveProperty( 'limit' );
	} );

	it( 'should filter to the primary event, matching the ranked report', () => {
		const options = buildGoalDriverTotalReportOptions( {
			dates,
			primaryEvent: 'purchase',
			reportIDSuffix: 'top-authors',
		} );

		expect( options?.dimensionFilters ).toMatchObject( {
			eventName: {
				filterType: 'inListFilter',
				value: [ 'purchase' ],
			},
		} );
	} );

	it( 'should append the given context to the reportID, and omit it otherwise', () => {
		const withoutContext = buildGoalDriverTotalReportOptions( {
			dates,
			primaryEvent: 'purchase',
			reportIDSuffix: 'top-authors',
		} );
		const withContext = buildGoalDriverTotalReportOptions( {
			dates,
			primaryEvent: 'purchase',
			reportIDSuffix: 'top-authors',
			context: 'ecommerce',
		} );

		expect( withContext?.reportID ).toBe(
			`${ withoutContext?.reportID }_ecommerce`
		);
	} );
} );
