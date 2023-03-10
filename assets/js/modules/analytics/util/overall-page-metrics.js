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
import { calculateChange } from '../../../util';
import parseDimensionStringToDate from '../util/parseDimensionStringToDate';

/**
 * Parse Analytics report into data suitable for rendering the data blocks in the Overall Page Metrics widget.
 *
 * @typedef {Object} OverallPageMetricsData
 * @property {string}         metric          - Google Analytics metric identifier.
 * @property {string}         title           - Translated metric title.
 * @property {Array.<Object>} sparkLineData   - Data for rendering the sparkline.
 * @property {string}         [datapointUnit] - Optional datapoint unit, e.g. '%', 's'.
 * @property {number}         total           - Total count for the metric.
 * @property {number}         change          - Monthly change for the metric.
 *
 * @since 1.45.0
 * @since 1.96.0 Extracted to its own file.
 *
 * @param {Object} report Analytics report data.
 * @return {Array.<OverallPageMetricsData>} Array of data for rendering the data blocks in the Overall Page Metrics widget.
 */

export function calculateOverallPageMetricsData( report ) {
	const metricsData = [
		{
			metric: 'ga:pageviews',
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
			metric: 'ga:uniquePageviews',
			title: __( 'Unique Pageviews', 'google-site-kit' ),
			sparkLineData: [
				[
					{ type: 'date', label: 'Day' },
					{ type: 'number', label: 'Unique Pageviews' },
				],
			],
			total: 0,
			change: 0,
		},
		{
			metric: 'ga:bounceRate',
			title: __( 'Bounce Rate', 'google-site-kit' ),
			sparkLineData: [
				[
					{ type: 'date', label: 'Day' },
					{ type: 'number', label: 'Bounce Rate' },
				],
			],
			datapointUnit: '%',
			datapointDivider: 100,
			total: 0,
			change: 0,
		},
		{
			metric: 'ga:avgSessionDuration',
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

	const { totals = [], rows = [] } = report?.[ 0 ]?.data || {};

	const lastMonth = totals[ 0 ]?.values || [];
	const previousMonth = totals[ 1 ]?.values || [];

	return metricsData.map(
		( { datapointDivider = 1, ...metricData }, index ) => {
			// We only want half the date range, having a comparison date range in the query doubles the range.
			for ( let i = Math.ceil( rows.length / 2 ); i < rows.length; i++ ) {
				const { values } = rows[ i ].metrics[ 0 ];
				const dateString = rows[ i ].dimensions[ 0 ];
				const date = parseDimensionStringToDate( dateString );

				metricData.sparkLineData.push( [ date, values[ index ] ] );
			}

			metricData.total = ( lastMonth[ index ] || 0 ) / datapointDivider;
			metricData.change = calculateChange(
				previousMonth[ index ] || 0,
				lastMonth[ index ] || 0
			);

			return metricData;
		}
	);
}
