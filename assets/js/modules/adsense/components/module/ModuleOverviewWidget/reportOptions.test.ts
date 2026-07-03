/**
 * ModuleOverviewWidget report options tests.
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
import {
	MODULE_OVERVIEW_METRICS,
	getCurrentRangeArgs,
	getCurrentRangeChartArgs,
	getPreviousRangeArgs,
	getPreviousRangeChartArgs,
} from './reportOptions';

// The builders must keep producing the exact report args the dashboard relied
// on when they were inlined, so the dashboard and PDF report cannot drift.
describe( 'ModuleOverviewWidget report options', () => {
	const dates = {
		startDate: '2025-01-08',
		endDate: '2025-01-14',
		compareStartDate: '2025-01-01',
		compareEndDate: '2025-01-07',
	};

	it( 'should map each metric identifier to its card label in report column order', () => {
		expect( MODULE_OVERVIEW_METRICS ).toEqual( {
			ESTIMATED_EARNINGS: 'Earnings',
			PAGE_VIEWS_RPM: 'Page RPM',
			IMPRESSIONS: 'Impressions',
			PAGE_VIEWS_CTR: 'Page CTR',
		} );
		expect( Object.keys( MODULE_OVERVIEW_METRICS ) ).toEqual( [
			'ESTIMATED_EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
			'PAGE_VIEWS_CTR',
		] );
	} );

	it( 'should build the current-period totals args used by the dashboard', () => {
		expect( getCurrentRangeArgs( dates ) ).toEqual( {
			metrics: [
				'ESTIMATED_EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
			],
			startDate: dates.startDate,
			endDate: dates.endDate,
			reportID: 'adsense_module-overview-widget_widget_currentRangeArgs',
		} );
	} );

	it( 'should build the previous-period totals args from the comparison dates', () => {
		expect( getPreviousRangeArgs( dates ) ).toEqual( {
			metrics: [
				'ESTIMATED_EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
			],
			startDate: dates.compareStartDate,
			endDate: dates.compareEndDate,
			reportID: 'adsense_module-overview-widget_widget_previousRangeArgs',
		} );
	} );

	it( 'should build the current-period daily series args with the DATE dimension', () => {
		expect( getCurrentRangeChartArgs( dates ) ).toEqual( {
			metrics: [
				'ESTIMATED_EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
			],
			startDate: dates.startDate,
			endDate: dates.endDate,
			dimensions: [ 'DATE' ],
			reportID:
				'adsense_module-overview-widget_widget_currentRangeChartArgs',
		} );
	} );

	it( 'should build the previous-period daily series args with the DATE dimension', () => {
		expect( getPreviousRangeChartArgs( dates ) ).toEqual( {
			metrics: [
				'ESTIMATED_EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
			],
			startDate: dates.compareStartDate,
			endDate: dates.compareEndDate,
			dimensions: [ 'DATE' ],
			reportID:
				'adsense_module-overview-widget_widget_previousRangeChartArgs',
		} );
	} );
} );
