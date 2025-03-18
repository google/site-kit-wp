/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { getAnalytics4MockResponse } from '../../../utils/data-mock';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';

/**
 * Limits the response to a single date range.
 *
 * @since n.e.x.t
 *
 * @param {Object} analyticsResponse The Analytics report response.
 * @return {Object} The report response with a single row for each date range.
 */
export function limitResponseToSingleDate( analyticsResponse ) {
	const firstRowForRange0 = analyticsResponse.rows.find(
		( { dimensionValues } ) => dimensionValues[ 1 ].value === 'date_range_0'
	);

	const matchingRowForRange1 = analyticsResponse.rows.find(
		( { dimensionValues } ) =>
			dimensionValues[ 1 ].value === 'date_range_1' &&
			dimensionValues[ 0 ].value ===
				firstRowForRange0.dimensionValues[ 0 ].value
	);

	const report = {
		...analyticsResponse,
		rows: [ firstRowForRange0, matchingRowForRange1 ],
	};

	return report;
}

/**
 * Provides a report with special handling for the '(other)' row.
 *
 * The function doubles the value of the '(other)' row to ensure it's visible in the pie chart.
 * This is to ensure the special handling of the '(other)' row's tooltip is included in the story.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry instance.
 * @param {Object} options  The report options.
 */
export function provideReportWithIncreasedOtherDimension( registry, options ) {
	const report = getAnalytics4MockResponse( options );

	report.rows
		.filter( ( row ) => row.dimensionValues[ 0 ].value === '(other)' )
		.forEach( ( row ) => {
			row.metricValues[ 0 ].value = `${
				parseInt( row.metricValues[ 0 ].value, 10 ) * 2
			}`;
		} );

	report.rows.sort(
		( a, b ) =>
			parseInt( b.metricValues[ 0 ].value, 10 ) -
			parseInt( a.metricValues[ 0 ].value, 10 )
	);

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( report, {
		options,
	} );
}
