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
	buildEngagementReportOptions,
	buildPrimaryEventReportOptions,
} from './headlineMetrics';

describe( 'buildPrimaryEventReportOptions', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	it( 'should return undefined without a primary event', () => {
		expect(
			buildPrimaryEventReportOptions( dates, undefined )
		).toBeUndefined();
	} );

	it( 'should filter the report to the primary event', () => {
		const options = buildPrimaryEventReportOptions( dates, 'purchase' );

		expect( options?.dimensionFilters ).toMatchObject( {
			eventName: 'purchase',
		} );
	} );

	it( 'should scope the report to a breakdown filter when provided', () => {
		const options = buildPrimaryEventReportOptions( dates, 'purchase', {
			someDimension: 'someValue',
		} );

		expect( options?.dimensionFilters ).toMatchObject( {
			someDimension: 'someValue',
		} );
	} );
} );

describe( 'buildEngagementReportOptions', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	it( 'should request engagement rate and sessions', () => {
		const options = buildEngagementReportOptions( dates );

		expect( options.metrics ).toEqual( [
			{ name: 'engagementRate' },
			{ name: 'sessions' },
		] );
	} );

	it( 'should never scope the engagement report to the goal events', () => {
		// Filtering engagement by `eventName` would count only the
		// sessions that already converted, pushing the rate to ~100%.
		expect( buildEngagementReportOptions( dates ) ).not.toHaveProperty(
			'dimensionFilters'
		);
	} );

	it( 'should scope the report to a breakdown filter when provided', () => {
		const options = buildEngagementReportOptions( dates, {
			someDimension: 'someValue',
		} );

		expect( options.dimensionFilters ).toEqual( {
			someDimension: 'someValue',
		} );
	} );
} );
