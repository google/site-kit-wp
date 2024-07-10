/**
 * Analytics-4 Dashboard data extraction functions.
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
 * External dependencies
 */
import classnames from 'classnames';
import { identity } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getLocale } from '../../../util/i18n';
import {
	convertSecondsToArray,
	numFmt,
	getChartDifferenceArrow,
	calculateDifferenceBetweenChartValues,
} from '../../../util';
import { partitionAnalytics4Report } from './partition-report';
import parseDimensionStringToDate from './parseDimensionStringToDate';

/**
 * Reduces and processes an array of analytics-4 row data.
 *
 * @since 1.96.0
 *
 * @param {Array}  rows          An array of rows to reduce.
 * @param {number} selectedStats The currently selected stat we need to return data for.
 * @return {Array} Array of selected stats from analytics row data.
 */
function reduceAnalytics4RowsData( rows, selectedStats ) {
	const dataMap = [];
	rows.forEach( ( row ) => {
		if ( ! row.metricValues ) {
			return;
		}

		const { value } = row.metricValues[ selectedStats ];
		const dateString = row.dimensionValues[ 0 ].value;
		const date = parseDimensionStringToDate( dateString );
		dataMap.push( [ date, value ] );
	} );
	return dataMap;
}

/**
 * Extracts the data required from an analytics 'site-analytics' request.
 *
 * @since 1.96.0
 * @since 1.98.0 Added chartDataFormats parameter.
 *
 * @param {Object} report             The data returned from the Analytics API call.
 * @param {Array}  selectedStats      The currently selected stat we need to return data for.
 * @param {number} days               The number of days to extract data for. Pads empty data days.
 * @param {string} referenceDate      The reference date.
 * @param {Array}  dataLabels         The labels to be displayed.
 * @param {Array}  tooltipDataFormats The formats to be used for the tooltip data.
 * @param {Array}  chartDataFormats   The formats to be used for the chart data.
 * @return {Array} The dataMap ready for charting.
 */
export function extractAnalytics4DashboardData(
	report,
	selectedStats,
	days,
	referenceDate,
	dataLabels = [
		__( 'Users', 'google-site-kit' ),
		__( 'Sessions', 'google-site-kit' ),
		__( 'Engagement Rate', 'google-site-kit' ),
		__( 'Session Duration', 'google-site-kit' ),
	],
	tooltipDataFormats = [
		( x ) => parseFloat( x ).toLocaleString(),
		( x ) => parseFloat( x ).toLocaleString(),
		( x ) =>
			numFmt( x / 100, {
				style: 'percent',
				signDisplay: 'never',
				maximumFractionDigits: 2,
			} ),
		( x ) => numFmt( x, 's' ),
	],
	chartDataFormats = [ identity, identity, ( x ) => x * 100, identity ]
) {
	const rows = [ ...( report?.rows || [] ) ]; // Copying it to escape side effects by manipulating with rows.
	const rowLength = rows.length;

	// Pad rows to 2 x number of days data points to accommodate new accounts.
	if ( days * 2 > rowLength ) {
		const date = new Date( referenceDate ); // eslint-disable-line sitekit/no-direct-date
		for ( let i = 0; days > i; i++ ) {
			const month = ( date.getMonth() + 1 ).toString();
			const day = date.getDate().toString();
			const dateString =
				date.getFullYear().toString() +
				( 2 > month.length ? '0' : '' ) +
				month +
				( 2 > day.length ? '0' : '' ) +
				day;

			if ( i > rowLength ) {
				const emptyDay = [
					{
						dimensionValues: [
							{
								value: dateString,
							},
							{
								value: 'date_range_0',
							},
						],
						metricValues: [ { value: 0 }, { value: 0 } ],
					},
					{
						dimensionValues: [
							{
								value: dateString,
							},
							{
								value: 'date_range_1',
							},
						],
						metricValues: [ { value: 0 }, { value: 0 } ],
					},
				];
				rows.unshift( ...emptyDay );
			}
			date.setDate( date.getDate() - 1 );
		}

		rows.push(
			{
				dimensionValues: [
					{
						value: '0',
					},
					{
						value: 'date_range_0',
					},
				],
			},
			{
				dimensionValues: [
					{
						value: '0',
					},
					{
						value: 'date_range_1',
					},
				],
			}
		);
	}

	const isSessionDuration =
		dataLabels[ selectedStats ] ===
		__( 'Session Duration', 'google-site-kit' );
	const dataType = isSessionDuration ? 'timeofday' : 'number';

	const dataMap = [
		[
			{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
			{ type: 'string', role: 'tooltip', p: { html: true } },
			{ type: dataType, label: dataLabels[ selectedStats ] },
			{
				type: dataType,
				label: __( 'Previous period', 'google-site-kit' ),
			},
		],
	];

	const { compareRange, currentRange } = partitionAnalytics4Report( rows, {
		dateRangeLength: days,
	} );
	const lastMonthData = reduceAnalytics4RowsData(
		currentRange,
		selectedStats
	);
	const previousMonthData = reduceAnalytics4RowsData(
		compareRange,
		selectedStats
	);

	const locale = getLocale();
	const localeDateOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	};

	lastMonthData.forEach( ( row, i ) => {
		if ( ! row[ 0 ] || ! row[ 1 ] || ! previousMonthData[ i ] ) {
			return;
		}

		const chartDataFormat = chartDataFormats[ selectedStats ];
		const currentMonthDatum = chartDataFormat( row[ 1 ] );
		const previousMonthDatum = chartDataFormat(
			previousMonthData[ i ][ 1 ]
		);

		const prevMonth = parseFloat( previousMonthDatum );

		const difference = calculateDifferenceBetweenChartValues(
			currentMonthDatum,
			prevMonth
		);
		const svgArrow = getChartDifferenceArrow( difference );
		const dateRange = sprintf(
			/* translators: 1: date for user stats, 2: previous date for user stats comparison */
			_x(
				'%1$s vs %2$s',
				'Date range for chart tooltip',
				'google-site-kit'
			),
			row[ 0 ].toLocaleDateString( locale, localeDateOptions ),
			previousMonthData[ i ][ 0 ].toLocaleDateString(
				locale,
				localeDateOptions
			)
		);

		const statInfo = sprintf(
			/* translators: 1: selected stat label, 2: numeric value of selected stat, 3: up or down arrow , 4: different change in percentage */
			_x(
				'%1$s: <strong>%2$s</strong> <em>%3$s %4$s</em>',
				'Stat information for chart tooltip',
				'google-site-kit'
			),
			dataLabels[ selectedStats ],
			tooltipDataFormats[ selectedStats ]( currentMonthDatum ),
			svgArrow,
			numFmt( Math.abs( difference ), '%' )
		);

		dataMap.push( [
			row[ 0 ],
			`<div class="${ classnames( 'googlesitekit-visualization-tooltip', {
				'googlesitekit-visualization-tooltip--up': difference > 0,
				'googlesitekit-visualization-tooltip--down': difference < 0,
			} ) }">
				<p>${ dateRange }</p>
				<p>${ statInfo }</p>
			</div>`,
			isSessionDuration
				? convertSecondsToArray( currentMonthDatum )
				: currentMonthDatum,
			isSessionDuration
				? convertSecondsToArray( previousMonthDatum )
				: previousMonthDatum,
		] );
	} );

	return dataMap;
}
