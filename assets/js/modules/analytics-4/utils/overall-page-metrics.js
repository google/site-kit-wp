/**
 * Overall Page Metrics utility functions.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import parseDimensionStringToDate from '../../analytics/util/parseDimensionStringToDate';
import { calculateChange, stringToDate } from '../../../util';

/**
 * Parse Analytics 4 report into data suitable for rendering the data blocks in the Overall Page Metrics widget.
 *
 * @typedef {Object} OverallPageMetricsData
 * @property {string}         metric          - Google Analytics metric identifier.
 * @property {string}         title           - Translated metric title.
 * @property {Array.<Object>} sparkLineData   - Data for rendering the sparkline.
 * @property {string}         [datapointUnit] - Optional datapoint unit, e.g. '%', 's'.
 * @property {number}         total           - Total count for the metric.
 * @property {number}         change          - Monthly change for the metric.
 *
 * @since 1.96.0
 *
 * @param {Object} report    Analytics report data.
 * @param {string} startDate Start date for the report.
 * @return {Array.<OverallPageMetricsData>} Array of data for rendering the data blocks in the Overall Page Metrics widget.
 */

export function calculateOverallPageMetricsData( report, startDate ) {
	const metricsData = [
		{
			metric: 'screenPageViews',
			title: __( 'Pageviews', 'google-site-kit' ),
			sparkLineData: [
				[
					{ type: 'date', label: 'Day' },
					{ type: 'number', label: 'Pageviews' },
				],
			],
			total: 0,
			change: 0,
		},
		{
			metric: 'sessions',
			title: __( 'Sessions', 'google-site-kit' ),
			sparkLineData: [
				[
					{ type: 'date', label: 'Day' },
					{ type: 'number', label: 'Sessions' },
				],
			],
			total: 0,
			change: 0,
		},
		{
			metric: 'engagementRate',
			title: __( 'Engagement Rate', 'google-site-kit' ),
			sparkLineData: [
				[
					{ type: 'date', label: 'Day' },
					{ type: 'number', label: 'Engagement Rate' },
				],
			],
			datapointUnit: '%',
			total: 0,
			change: 0,
		},
		{
			metric: 'averageSessionDuration',
			title: __( 'Session Duration', 'google-site-kit' ),
			sparkLineData: [
				[
					{ type: 'date', label: 'Day' },
					{ type: 'number', label: 'Session Duration' },
				],
			],
			datapointUnit: 's',
			total: 0,
			change: 0,
		},
	];

	const { totals = [], rows = [] } = report || {};

	const lastMonth = totals[ 0 ]?.metricValues || [];
	const previousMonth = totals[ 1 ]?.metricValues || [];

	const startDateTime = stringToDate( startDate ).getTime();
	const currentDateRangeRows = rows.filter( ( { dimensionValues } ) => {
		if ( dimensionValues[ 1 ].value !== 'date_range_0' ) {
			return false;
		}

		// We only want half of the date range, as having a comparison date range in the query doubles the range.
		// In order to achieve this, we filter out entries before the start date (the comparison start date will be earlier).
		const rowDate = parseDimensionStringToDate(
			dimensionValues[ 0 ].value
		);
		return rowDate.getTime() >= startDateTime;
	} );

	return metricsData.map(
		( { datapointDivider = 1, ...metricData }, index ) => {
			currentDateRangeRows.forEach(
				( { dimensionValues, metricValues } ) => {
					const dateString = dimensionValues[ 0 ].value;
					const date = parseDimensionStringToDate( dateString );

					metricData.sparkLineData.push( [
						date,
						metricValues[ index ].value,
					] );
				}
			);

			metricData.total =
				( lastMonth[ index ]?.value || 0 ) / datapointDivider;
			metricData.change = calculateChange(
				previousMonth[ index ]?.value || 0,
				lastMonth[ index ]?.value || 0
			);

			return metricData;
		}
	);
}
