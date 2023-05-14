/**
 * Analytics utility functions.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { each } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getLocale } from '../../../util/i18n';
import parseDimensionStringToDate from './parseDimensionStringToDate';
import {
	convertSecondsToArray,
	numFmt,
	getChartDifferenceArrow,
	calculateDifferenceBetweenChartValues,
} from '../../../util';
import { partitionReport } from '../../../util/partition-report';

export { default as parsePropertyID } from './parse-property-id';
export * from './is-zero-report';
export * from './validation';
export * from './time-column-format';
export * from './property';

/**
 * Extracts data required for a pie chart from the Analytics report information.
 *
 * @since 1.16.0 Added keyColumnIndex argument.
 * @since 1.24.0 Updated the function signature to use options argument instead of keyColumnIndex.
 *
 * @param {Array}    reports                   The array with reports data.
 * @param {Object}   [options]                 Optional. Data extraction options.
 * @param {number}   [options.keyColumnIndex]  Optional. The number of a column to extract metrics data from.
 * @param {number}   [options.maxSlices]       Optional. Limit the number of slices to display.
 * @param {boolean}  [options.withOthers]      Optional. Whether to add "Others" record to the data map. Only relevant
 *                                             if `maxSlices` is passed. If passed, the final slice will be the
 *                                             "Others" slice, i.e. the number of actual row slices will be
 *                                             `maxSlices - 1`.
 * @param {Function} [options.tooltipCallback] Optional. A callback function for tooltip column values.
 * @return {Array} Extracted data.
 */
export function extractAnalyticsDataForPieChart( reports, options = {} ) {
	const {
		keyColumnIndex = 0,
		maxSlices,
		withOthers = false,
		tooltipCallback,
	} = options;

	const { data = {} } = reports?.[ 0 ] || {};
	const { rows = [], totals = [] } = data;

	const withTooltips = typeof tooltipCallback === 'function';
	const columns = [ 'Source', 'Percent' ];
	if ( withTooltips ) {
		columns.push( {
			type: 'string',
			role: 'tooltip',
			p: {
				html: true,
			},
		} );
	}

	const totalUsers = totals?.[ 0 ]?.values?.[ keyColumnIndex ] || 0;
	const dataMap = [ columns ];

	let hasOthers = withOthers;
	let rowsNumber = rows.length;
	let others = 1;
	if ( maxSlices > 0 ) {
		hasOthers = withOthers && rows.length > maxSlices;
		rowsNumber = Math.min(
			rows.length,
			hasOthers ? maxSlices - 1 : maxSlices
		);
	} else {
		hasOthers = false;
		rowsNumber = rows.length;
	}

	for ( let i = 0; i < rowsNumber; i++ ) {
		const row = rows[ i ];
		const users = row.metrics[ 0 ].values[ keyColumnIndex ];
		const percent = totalUsers > 0 ? users / totalUsers : 0;

		others -= percent;

		const rowData = [ row.dimensions[ 0 ], percent ];
		if ( withTooltips ) {
			rowData.push( tooltipCallback( row, rowData ) );
		}

		dataMap.push( rowData );
	}

	if ( hasOthers && others > 0 ) {
		const rowData = [ __( 'Others', 'google-site-kit' ), others ];
		if ( withTooltips ) {
			rowData.push( tooltipCallback( null, rowData ) );
		}

		dataMap.push( rowData );
	}

	return dataMap;
}

/**
 * Reduces and processes an array of analytics row data.
 *
 * @since 1.0.0
 *
 * @param {Array}  rows                 An array of rows to reduce.
 * @param {number} selectedMetricsIndex The index of metrics array in the metrics set.
 * @param {number} selectedStats        The currently selected stat we need to return data for.
 * @return {Array} Array of selected stats from analytics row data.
 */
function reduceAnalyticsRowsData( rows, selectedMetricsIndex, selectedStats ) {
	const dataMap = [];
	each( rows, ( row ) => {
		if ( row.metrics ) {
			const { values } = row.metrics[ selectedMetricsIndex ];
			const dateString = row.dimensions[ 0 ];
			const date = parseDimensionStringToDate( dateString );
			dataMap.push( [ date, values[ selectedStats ] ] );
		}
	} );
	return dataMap;
}

/**
 * Extracts the data required from an analytics 'site-analytics' request.
 *
 * @since 1.0.0
 *
 * @param {Object} reports                  The data returned from the Analytics API call.
 * @param {Array}  selectedStats            The currently selected stat we need to return data for.
 * @param {number} days                     The number of days to extract data for. Pads empty data days.
 * @param {number} currentMonthMetricIndex  The index of the current month metrics in the metrics set.
 * @param {number} previousMonthMetricIndex The index of the last month metrics in the metrics set.
 * @param {Array}  dataLabels               The labels to be displayed.
 * @param {Array}  tooltipDataFormats       The formats to be used for the data.
 * @return {Array} The dataMap ready for charting.
 */
export function extractAnalyticsDashboardData(
	reports,
	selectedStats,
	days,
	currentMonthMetricIndex = 0,
	previousMonthMetricIndex = 0,
	dataLabels = [
		__( 'Users', 'google-site-kit' ),
		__( 'Sessions', 'google-site-kit' ),
		__( 'Bounce Rate %', 'google-site-kit' ),
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
	]
) {
	if ( ! Array.isArray( reports[ 0 ]?.data?.rows ) ) {
		return false;
	}

	const rows = [ ...reports[ 0 ].data.rows ]; // Copying it to escape side effects by manipulating with rows.
	const rowLength = rows.length;

	// Pad rows to 2 x number of days data points to accommodate new accounts.
	if ( days * 2 > rowLength ) {
		const date = new Date();
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
				const emptyDay = {
					dimensions: [ dateString ],
					metrics: [ { values: [ 0, 0, 0, 0, 0 ] } ],
				};
				rows.unshift( emptyDay );
			}
			date.setDate( date.getDate() - 1 );
		}
		rows.push( [ 0, 0 ] );
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

	const { compareRange, currentRange } = partitionReport( rows, {
		dateRangeLength: days,
	} );
	const lastMonthData = reduceAnalyticsRowsData(
		currentRange,
		currentMonthMetricIndex,
		selectedStats
	);
	const previousMonthData = reduceAnalyticsRowsData(
		compareRange,
		previousMonthMetricIndex,
		selectedStats
	);

	const locale = getLocale();
	const localeDateOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	};

	each( lastMonthData, ( row, i ) => {
		if ( ! row[ 0 ] || ! row[ 1 ] || ! previousMonthData[ i ] ) {
			return;
		}

		const prevMonth = parseFloat( previousMonthData[ i ][ 1 ] );

		const difference = calculateDifferenceBetweenChartValues(
			row[ 1 ],
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
			tooltipDataFormats[ selectedStats ]( row[ 1 ] ),
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
			isSessionDuration ? convertSecondsToArray( row[ 1 ] ) : row[ 1 ],
			isSessionDuration
				? convertSecondsToArray( previousMonthData[ i ][ 1 ] )
				: previousMonthData[ i ][ 1 ],
		] );
	} );

	return dataMap;
}
