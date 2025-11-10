/**
 * Google Chart utilities.
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
import { findLast, merge, set } from 'lodash';

/**
 * Internal dependencies
 */
import { BREAKPOINT_SMALL } from '@/js/hooks/useBreakpoint';
import { getLocale, stringToDate } from '@/js/util';

/**
 * Returns the Google chart data, filtered by selected stats if present.
 *
 * @since 1.93.0
 *
 * @param {Array|undefined} data          Chart data.
 * @param {Array|undefined} selectedStats The columns that should be displayed for the data set.
 * @return {Object} The chart data, filtered by selected stats if present.
 */
export function getFilteredChartData( data, selectedStats ) {
	if ( ! selectedStats?.length ) {
		return data;
	}

	// Ensure we don't filter out columns that aren't data, but are things like
	// tooltips or other content.
	let nonDataColumns = [];
	if ( data?.length ) {
		nonDataColumns = data[ 0 ].reduce( ( acc, row, rowIndex ) => {
			return row?.role ? [ ...acc, rowIndex ] : acc;
		}, [] );
	}

	return data.map( ( row ) => {
		return row.filter( ( _columnValue, columnIndex ) => {
			return (
				columnIndex === 0 ||
				selectedStats.includes( columnIndex - 1 ) ||
				nonDataColumns.includes( columnIndex - 1 )
			);
		} );
	} );
}

/**
 * Returns the optimal height and width for a preview element.
 *
 * @since 1.93.0
 *
 * @param {string|undefined} loadingHeight Preview height.
 * @param {string|undefined} height        Chart height.
 * @param {string|undefined} loadingWidth  Preview width.
 * @param {string|undefined} width         Chart width.
 * @return {Object} The optimal height and width to use in a preview element.
 */
export function getLoadingDimensions(
	loadingHeight,
	height,
	loadingWidth,
	width
) {
	const dimensions = {
		height: loadingHeight || height,
		width: loadingWidth || width,
	};
	// If a loading height is set but a width is not (or a loading width is set
	// but not a height), change the "unset" value to 100% to avoid visual bugs.
	// See: https://github.com/google/site-kit-wp/pull/2916#discussion_r623866269
	if ( dimensions.width && ! dimensions.height ) {
		dimensions.height = '100%';
	}
	if ( dimensions.height && ! dimensions.width ) {
		dimensions.width = '100%';
	}

	return dimensions;
}

/**
 * Returns a combined chart events object.
 *
 * @since 1.93.0
 *
 * @param {Array.<Object>|undefined} chartEvents Event names and its callbacks.
 * @param {Function|undefined}       onReady     Chart event.
 * @param {Function|undefined}       onSelect    Chart event.
 * @return {Object} The object containig all events.
 */
export function getCombinedChartEvents( chartEvents, onReady, onSelect ) {
	const combinedChartEvents = [ ...( chartEvents || [] ) ];

	if ( onReady ) {
		combinedChartEvents.push( {
			eventName: 'ready',
			callback: onReady,
		} );
	}

	if ( onSelect ) {
		combinedChartEvents.push( {
			eventName: 'select',
			callback: onSelect,
		} );
	}

	return combinedChartEvents;
}

/**
 * Returns a chart configuration object.
 *
 * @since 1.93.0
 * @since 1.119.0 Added `breakpoint` parameter.
 * @since 1.160.0 Refactored `gatheringData`, `chartType`, `startDate`, `endDate`, and `breakpoint` to be named parameters.
 *
 * @param {Object}  options                     Chart options to extend.
 * @param {Object}  configuration               Configuration for the extended chart options.
 * @param {boolean} configuration.gatheringData If chart is in gathering info state.
 * @param {string}  configuration.chartType     Chart types: PieChart, LineChart.
 * @param {string}  configuration.startDate     Start date for a user data range.
 * @param {string}  configuration.endDate       End date for a user data range.
 * @param {string}  configuration.breakpoint    Current breakpoint.
 * @return {Object} Chart options object.
 */
export function getChartOptions(
	options,
	{ gatheringData, chartType, startDate, endDate, breakpoint }
) {
	const chartOptions = structuredClone( options );
	if ( gatheringData && chartType === 'LineChart' ) {
		if ( ! options?.vAxis?.viewWindow?.min ) {
			set( chartOptions, 'vAxis.viewWindow.min', 0 );
		}

		if ( ! options?.vAxis?.viewWindow?.max ) {
			set( chartOptions, 'vAxis.viewWindow.max', 100 );
		}

		if ( ! options?.hAxis?.viewWindow?.min ) {
			set(
				chartOptions,
				'hAxis.viewWindow.min',
				stringToDate( startDate )
			);
			delete chartOptions.hAxis.ticks;
		}

		if ( ! options?.hAxis?.viewWindow?.max ) {
			set(
				chartOptions,
				'hAxis.viewWindow.max',
				stringToDate( endDate )
			);
			delete chartOptions.hAxis.ticks;
		}
	}

	if ( chartType === 'LineChart' ) {
		if ( ! options?.hAxis?.maxTextLines ) {
			set( chartOptions, 'hAxis.maxTextLines', 1 );
		}
		if ( ! options?.hAxis?.minTextSpacing ) {
			const minTextSpacing = breakpoint === BREAKPOINT_SMALL ? 50 : 100;
			set( chartOptions, 'hAxis.minTextSpacing', minTextSpacing );
		}
		// eslint-disable-next-line sitekit/acronym-case
		if ( options?.tooltip?.isHtml === undefined ) {
			set( chartOptions, 'tooltip.isHtml', true );
			set( chartOptions, 'tooltip.trigger', 'both' );
		}
	}

	merge( chartOptions, {
		hAxis: {
			textStyle: {
				fontSize: 10,
				color: '#5f6561',
			},
		},
		vAxis: {
			textStyle: {
				color: '#5f6561',
				fontSize: 10,
			},
		},
		legend: {
			textStyle: {
				color: '#131418',
				fontSize: 12,
			},
		},
	} );

	return chartOptions;
}

/**
 * Returns the Google Charts currency pattern for a given currency code and locale.
 *
 * @since 1.118.0
 *
 * @param {string} currencyCode ISO 4217 currency code.
 * @param {string} locale       Locale to use for formatting.
 * @return {string} The currency pattern.
 */
export function getCurrencyPattern( currencyCode, locale = getLocale() ) {
	const formatter = Intl.NumberFormat( locale, {
		style: 'currency',
		currency: currencyCode,
	} );

	const parts = formatter.formatToParts( 1000000 );

	return parts.reduce( ( pattern, part ) => {
		const { value } = part;

		switch ( part.type ) {
			case 'group':
				// The group and decimal separators will be replaced with the
				// locale-specific versions by the chart.
				// See: https://groups.google.com/g/google-visualization-api/c/hBF9daxe8qY/m/_aPk3EfQLgAJ
				return pattern + ',';
			case 'decimal':
				return pattern + '.';
			case 'currency':
				return pattern + value;
			case 'literal':
				const sanitizedValue = /^\s*$/.test( value ) ? value : '';
				return pattern + sanitizedValue;
			case 'integer':
				const integerPattern = value.replace( /\d/g, '#' );
				const isLastIntegerGroup =
					findLast( parts, ( { type } ) => 'integer' === type ) ===
					part;

				return (
					pattern +
					( isLastIntegerGroup
						? integerPattern.replace( /#$/, '0' )
						: integerPattern )
				);
			case 'fraction':
				return pattern + value.replace( /\d/g, '0' );
			default:
				return pattern;
		}
	}, '' );
}
