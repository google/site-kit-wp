/**
 * Site stats utilities.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getLocale,
	numFmt,
	getChartDifferenceArrow,
	stringToDate,
	calculateDifferenceBetweenChartValues,
} from '../../../util';
import { adsenseDateToInstance } from './date';

/**
 * Gets data for a Google Chart from an AdSense report.
 *
 * @since 1.23.0
 * @since 1.36.0 Updated for API v2 report format.
 *
 * @param {Object} current        A report object for the current period.
 * @param {Object} previous       A report object for the previous period.
 * @param {string} label          Metric label.
 * @param {number} selectedColumn Selected column index.
 * @param {Object} metadata       Data metadata.
 * @return {Array.<Array.<number|string>>} Data array.
 */
export function getSiteStatsDataForGoogleChart(
	current,
	previous,
	label,
	selectedColumn,
	metadata
) {
	const dataMap = [
		[
			{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
			{ type: 'string', role: 'tooltip', p: { html: true } },
			{ type: 'number', label },
			{
				type: 'number',
				label: __( 'Previous period', 'google-site-kit' ),
			},
		],
	];

	const nextDate = ( date ) => {
		// Valid use of `new Date()` with an argument.
		// eslint-disable-next-line sitekit/no-direct-date
		const next = new Date( date );
		next.setDate( date.getDate() + 1 );
		return next;
	};
	const findRowByDate = ( searchDate ) => ( row ) =>
		searchDate.getTime() === stringToDate( row.cells[ 0 ].value ).getTime();

	let currentDate = adsenseDateToInstance( current.startDate );
	let previousDate = adsenseDateToInstance( previous.startDate );
	const endDate = adsenseDateToInstance( current.endDate );

	const locale = getLocale();
	const localeDateOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	};

	while ( currentDate <= endDate ) {
		const currentMonth = parseFloat(
			( current?.rows || [] ).find( findRowByDate( currentDate ) )
				?.cells?.[ selectedColumn ]?.value || 0
		);
		const prevMonth = parseFloat(
			( previous?.rows || [] ).find( findRowByDate( previousDate ) )
				?.cells?.[ selectedColumn ]?.value || 0
		);

		const difference = calculateDifferenceBetweenChartValues(
			currentMonth,
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
			currentDate.toLocaleDateString( locale, localeDateOptions ),
			previousDate.toLocaleDateString( locale, localeDateOptions )
		);

		let tooltipData = numFmt( currentMonth, metadata?.currencyCode );
		if ( metadata?.type === 'METRIC_RATIO' ) {
			tooltipData = numFmt( currentMonth, '%' );
		}

		const statInfo = sprintf(
			/* translators: 1: selected stat label, 2: numeric value of selected stat, 3: up or down arrow , 4: different change in percentage, %%: percent symbol */
			_x(
				'%1$s: <strong>%2$s</strong> <em>%3$s %4$s%%</em>',
				'Stat information for chart tooltip',
				'google-site-kit'
			),
			label,
			tooltipData,
			svgArrow,
			Math.abs( difference )
				.toFixed( 2 )
				.replace( /(.00|0)$/, '' ) // .replace( ... ) removes trailing zeros
		);

		dataMap.push( [
			currentDate,
			`<div class="${ classnames( 'googlesitekit-visualization-tooltip', {
				'googlesitekit-visualization-tooltip--up': difference > 0,
				'googlesitekit-visualization-tooltip--down': difference < 0,
			} ) }">
				<p>${ dateRange }</p>
				<p>${ statInfo }</p>
			</div>`,
			currentMonth,
			prevMonth,
		] );

		currentDate = nextDate( currentDate );
		previousDate = nextDate( previousDate );
	}

	return dataMap;
}
