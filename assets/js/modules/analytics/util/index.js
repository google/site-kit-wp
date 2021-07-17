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
import calculateOverviewData from './calculateOverviewData';
import parseDimensionStringToDate from './parseDimensionStringToDate';
import { convertSecondsToArray, numFmt, getChartDifferenceArrow } from '../../../util';
import { partitionReport } from '../../../util/partition-report';

export { calculateOverviewData };

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
	if ( ! reports || ! reports.length ) {
		return null;
	}

	const {
		keyColumnIndex = 0,
		maxSlices,
		withOthers = false,
		tooltipCallback,
	} = options;

	const data = reports[ 0 ].data;
	const rows = data.rows;

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

	const totalUsers = data.totals[ 0 ].values[ keyColumnIndex ];
	const dataMap = [ columns ];

	let hasOthers = withOthers;
	let rowsNumber = rows.length;
	let others = 1;
	if ( maxSlices > 0 ) {
		hasOthers = withOthers && rows.length > maxSlices;
		rowsNumber = Math.min( rows.length, hasOthers ? maxSlices - 1 : maxSlices );
	} else {
		hasOthers = false;
		rowsNumber = rows.length;
	}

	for ( let i = 0; i < rowsNumber; i++ ) {
		const row = rows[ i ];
		const users = row.metrics[ 0 ].values[ keyColumnIndex ];
		const percent = ( users / totalUsers );

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
			dataMap.push( [
				date,
				values[ selectedStats ],
			] );
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
 * @return {Array} The dataMap ready for charting.
 */
export function extractAnalyticsDashboardData( reports, selectedStats, days, currentMonthMetricIndex = 0, previousMonthMetricIndex = 0 ) {
	if ( ! Array.isArray( reports[ 0 ]?.data?.rows ) ) {
		return false;
	}

	const rows = [ ...reports[ 0 ].data.rows ]; // Copying it to escape side effects by manipulating with rows.
	const rowLength = rows.length;

	// Pad rows to 2 x number of days data points to accommodate new accounts.
	if ( ( days * 2 ) > rowLength ) {
		const date = new Date();
		for ( let i = 0; days > i; i++ ) {
			const month = ( date.getMonth() + 1 ).toString();
			const day = date.getDate().toString();
			const dateString = date.getFullYear().toString() +
				( 2 > month.length ? '0' : '' ) +
				month +
				( 2 > day.length ? '0' : '' ) +
				day;

			if ( i > rowLength ) {
				const emptyWeek = {
					dimensions: [ dateString ],
					metrics: [ { values: [ 0, 0, 0, 0, 0 ] } ],
				};
				rows.unshift( emptyWeek );
			}
			date.setDate( date.getDate() - 1 );
		}
		rows.push( [ 0, 0 ] );
	}

	const dataLabels = [
		__( 'Users', 'google-site-kit' ),
		__( 'Sessions', 'google-site-kit' ),
		__( 'Bounce Rate %', 'google-site-kit' ),
		__( 'Session Duration', 'google-site-kit' ),
	];

	const dataFormats = [
		( x ) => parseFloat( x ).toLocaleString(),
		( x ) => parseFloat( x ).toLocaleString(),
		( x ) => numFmt( x / 100, {
			style: 'percent',
			signDisplay: 'never',
			maximumFractionDigits: 2,
		} ),
		( x ) => numFmt( x, 's' ),
	];

	const isSessionDuration = dataLabels[ selectedStats ] === __( 'Session Duration', 'google-site-kit' );
	const dataType = isSessionDuration ? 'timeofday' : 'number';

	const dataMap = [
		[
			{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
			{ type: 'string', role: 'tooltip', p: { html: true } },
			{ type: dataType, label: dataLabels[ selectedStats ] },
			{ type: dataType, label: __( 'Previous period', 'google-site-kit' ) },
		],
	];

	const { compareRange, currentRange } = partitionReport( rows, { dateRangeLength: days } );
	const lastMonthData = reduceAnalyticsRowsData( currentRange, currentMonthMetricIndex, selectedStats );
	const previousMonthData = reduceAnalyticsRowsData( compareRange, previousMonthMetricIndex, selectedStats );

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
		const difference = prevMonth !== 0
			? ( row[ 1 ] / prevMonth ) - 1
			: 1; // if previous month has 0, we need to pretend it's 100% growth, thus the "difference" has to be 1
		const svgArrow = getChartDifferenceArrow( difference );
		const dateRange = sprintf(
			/* translators: 1: date for user stats, 2: previous date for user stats comparison */
			_x( '%1$s vs %2$s', 'Date range for chart tooltip', 'google-site-kit' ),
			row[ 0 ].toLocaleDateString( locale, localeDateOptions ),
			previousMonthData[ i ][ 0 ].toLocaleDateString( locale, localeDateOptions ),
		);

		const statInfo = sprintf(
		/* translators: 1: selected stat label, 2: numeric value of selected stat, 3: up or down arrow , 4: different change in percentage */
			_x( '%1$s: <strong>%2$s</strong> <em>%3$s %4$s</em>', 'Stat information for chart tooltip', 'google-site-kit' ),
			dataLabels[ selectedStats ],
			dataFormats[ selectedStats ]( row[ 1 ] ),
			svgArrow,
			numFmt( Math.abs( difference ), '%' ),
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
			isSessionDuration ? convertSecondsToArray( previousMonthData[ i ][ 1 ] ) : previousMonthData[ i ][ 1 ],
		] );
	} );

	return dataMap;
}

/**
 * Extracts the data required from an analytics 'site-analytics' request.
 *
 * @since 1.0.0
 *
 * @param {Object} reports The data returned from the Analytics API call.
 * @return {Array} Required data from 'site-analytics' request.
 */
export const extractAnalyticsDashboardSparklineData = ( reports ) => {
	if ( ! reports || ! reports.length ) {
		return null;
	}

	// Data is returned as an object.
	const data = reports[ 0 ].data.rows;

	const dataMap = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Users' },
			{ type: 'number', label: 'Sessions' },
			{ type: 'number', label: 'Goals Completed' },
		],
	];

	each( data, ( row ) => {
		const { values } = row.metrics[ 0 ];
		const dateString = row.dimensions[ 0 ];
		const date = parseDimensionStringToDate( dateString );
		dataMap.push( [
			date,
			values[ 0 ],
			values[ 1 ],
			values[ 4 ],
		] );
	} );

	return dataMap;
};

/**
 * Translates Analytics API Error Response.
 *
 * @since 1.0.0
 * @see {@link https://developers.google.com/analytics/devguides/reporting/core/v4/errors}
 *
 * @param {string} status  Error status code.
 * @param {string} message Error message.
 * @return {string} Human readable Analytics API error message based on error status.
 */
export const translateAnalyticsError = ( status, message ) => {
	let translatedMessage = '';

	switch ( status ) {
		case 'INVALID_ARGUMENT':
			translatedMessage = __( 'Analytics module needs to be configured.', 'google-site-kit' );
			break;
		case 'UNAUTHENTICATED':
			translatedMessage = __( 'You need to be authenticated to get this data.', 'google-site-kit' );
			break;
		case 'PERMISSION_DENIED':
			translatedMessage = __( 'Your account does not have sufficient permission to access this data, please consult to your web administrator.', 'google-site-kit' );
			break;
		case 'RESOURCE_EXHAUSTED':
			translatedMessage = __( 'Your account exceeded the maximum quota. Please try again later.', 'google-site-kit' );
			break;
		case 'INTERNAL':
			translatedMessage = __( 'Unexpected internal server error occurred.', 'google-site-kit' );
			break;
		case 'BACKEND_ERROR':
			translatedMessage = __( 'Analytics server returned unknown error. Please try again later.', 'google-site-kit' );
			break;
		case 'UNAVAILABLE':
			translatedMessage = __( 'The service was unable to process the request. Please try again later.', 'google-site-kit' );
			break;
		default:
			translatedMessage = message;
			break;
	}

	return translatedMessage;
};

export const getAnalyticsErrorMessageFromData = ( data ) => {
	// Specific Analytics API errors (legacy?).
	if ( data.error && data.error.status ) {
		return translateAnalyticsError( data.error.status, data.error.message );
	}

	// Regular WP error handling.
	if ( data.code && data.message && data.data?.status ) {
		return data.message;
	}

	return false;
};

/**
 * Checks for Zero data from Analytics API.
 *
 * @since 1.0.0
 *
 * @param {Object} data The data returned from the Analytics API call.
 * @return {boolean} Indicates if zero data returned from Analytics API call or not.
 */
export const isDataZeroForReporting = ( data ) => {
	// Handle empty data.
	if ( ! data || ! data.length ) {
		return true;
	}

	if ( data && data[ 0 ] && data[ 0 ].data && data[ 0 ].data.totals && data[ 0 ].data.totals[ 0 ] ) {
		const { values } = data[ 0 ].data.totals[ 0 ];

		// Are all the data points zeros?
		let allZeros = true;
		each( values, ( value ) => {
			if ( 0 !== parseInt( value, 10 ) ) {
				allZeros = false;
			}
		} );
		return allZeros;
	}

	return false;
};

/**
 * Default data object for making Analytics adsense requests.
 *
 * @since 1.0.0
 *
 * @type {Object}
 */
export const analyticsAdsenseReportDataDefaults = {
	dimensions: [
		'ga:pageTitle',
		'ga:pagePath',
	].join( ',' ),
	metrics: [
		{
			expression: 'ga:adsenseRevenue',
			alias: 'Earnings',
		},
		{
			expression: 'ga:adsenseECPM',
			alias: 'Page RPM',
		},
		{
			expression: 'ga:adsensePageImpressions',
			alias: 'Impressions',
		},
	],
	orderby: [
		{
			fieldName: 'ga:adsenseRevenue',
			sortOrder: 'DESCENDING',
		},
	],
	limit: 10,
};

/**
 * Default data object for making Analytics site analytics report requests.
 *
 * @since 1.0.0
 *
 * @type {Object}
 */
export const siteAnalyticsReportDataDefaults = {
	compareDateRanges: 1,
	dimensions: 'ga:date',
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Users',
		},
		{
			expression: 'ga:sessions',
			alias: 'Sessions',
		},
		{
			expression: 'ga:bounceRate',
			alias: 'Bounce Rate',
		},
		{
			expression: 'ga:avgSessionDuration',
			alias: 'Average Session Duration',
		},
		{
			expression: 'ga:goalCompletionsAll',
			alias: 'Goal Completions',
		},
	],
	limit: 180,
};

/**
 * Default data object for making Analytics site analytics report requests.
 *
 * @since 1.0.0
 *
 * @type {Object}
 */
export const overviewReportDataDefaults = {
	multiDateRange: 1,
	dimensions: 'ga:date',
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Users',
		},
		{
			expression: 'ga:sessions',
			alias: 'Sessions',
		},
		{
			expression: 'ga:bounceRate',
			alias: 'Bounce Rate',
		},
		{
			expression: 'ga:avgSessionDuration',
			alias: 'Average Session Duration',
		},
		{
			expression: 'ga:goalCompletionsAll',
			alias: 'Goal Completions',
		},
		{
			expression: 'ga:pageviews',
			alias: 'Pageviews',
		},
	],
	limit: 10,
};

/**
 * Default data object for making Analytics user report requests.
 *
 * @since 1.0.0
 *
 * @type {Object}
 */
export const userReportDataDefaults = {
	multiDateRange: 1,
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Total Users',
		},
	],
};

/**
 * Default data object for making Analytics traffic sources report requests.
 *
 * @since 1.0.0
 *
 * @type {Object}
 */
export const trafficSourcesReportDataDefaults = {
	dimensions: 'ga:channelGrouping',
	metrics: [
		{
			expression: 'ga:sessions',
			alias: 'Sessions',
		},
		{
			expression: 'ga:users',
			alias: 'Users',
		},
		{
			expression: 'ga:newUsers',
			alias: 'New Users',
		},
	],
	orderby: [
		{
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
	],
	limit: 10,
};

/**
 * Returns the default data object for making Analytics top pages report requests.
 *
 * @since 1.0.0
 *
 * @return {Object} Request data object defaults.
 */
export const getTopPagesReportDataDefaults = () => {
	const metrics = [
		{
			expression: 'ga:pageviews',
			alias: 'Pageviews',
		},
		{
			expression: 'ga:uniquePageviews',
			alias: 'Unique Pageviews',
		},
		{
			expression: 'ga:bounceRate',
			alias: 'Bounce rate',
		},
	];

	return {
		dimensions: [
			'ga:pageTitle',
			'ga:pagePath',
		].join( ',' ),
		metrics,
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 10,
	};
};

/**
 * Returns the extracted total and past user data.
 *
 * @since 1.14.0
 *
 * @param {Array} data The data returned from the Analytics API call.
 * @return {Object} The extracted user data in the form { totalUsers, previousTotalUsers }.
 */
export const parseTotalUsersData = ( data ) => {
	return {
		totalUsers: data?.[ 0 ]?.data?.totals?.[ 0 ]?.values?.[ 0 ],
		previousTotalUsers: data?.[ 0 ]?.data?.totals?.[ 1 ]?.values?.[ 0 ],
	};
};
