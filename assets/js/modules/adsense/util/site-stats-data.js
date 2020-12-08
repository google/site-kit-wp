/**
 * Site stats utlities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { readableLargeNumber, numberFormat, getLocale } from '../../../util';

/**
 * Gets data for a Google Chart from an adesnse report.
 *
 * @since n.e.x.t
 *
 * @param {Object} current        A report object for the current period.
 * @param {Object} previous       A report object for the previous period.
 * @param {string} label          Metric label.
 * @param {number} selectedColumn Selected column index.
 * @param {Object} metadata       Data metadata.
 * @return {Array.<Array.<number|string>>} Data array.
 */
export function getSiteStatsDataForGoogleChart( current, previous, label, selectedColumn, metadata ) {
	const dataMap = [
		[
			{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
			{ type: 'string', role: 'tooltip', p: { html: true } },
			{ type: 'number', label },
			{ type: 'number', label: __( 'Previous period', 'google-site-kit' ) },
		],
	];

	const stringToDate = ( dateString ) => new Date( `${ dateString } 00:00:00` );
	const findRowByDate = ( searchDate ) => ( ( [ rowDate ] ) => searchDate.getTime() === stringToDate( rowDate ).getTime() );

	const currentDate = stringToDate( current.startDate );
	const previousDate = stringToDate( previous.startDate );

	const ends = stringToDate( current.endDate );

	const locale = getLocale();
	const localeDateOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	};

	while ( +currentDate <= +ends ) {
		const currentMonth = parseFloat( ( current?.rows || [] ).find( findRowByDate( currentDate ) )?.[ selectedColumn ] || 0 );
		const prevMonth = parseFloat( ( previous?.rows || [] ).find( findRowByDate( previousDate ) )?.[ selectedColumn ] || 0 );

		const difference = prevMonth !== 0
			? ( currentMonth * 100 / prevMonth ) - 100
			: 100; // if previous month has 0, we need to pretend it's 100% growth, thus the "difference" has to be 100

		const dateRange = sprintf(
			/* translators: %1$s: date for user stats, %2$s: previous date for user stats comparison */
			_x( '%1$s vs %2$s', 'Date range for AdSense dashboard chart tooltip', 'google-site-kit' ),
			currentDate.toLocaleDateString( locale, localeDateOptions ),
			previousDate.toLocaleDateString( locale, localeDateOptions ),
		);

		let tooltipData = readableLargeNumber( currentMonth, metadata?.currency );
		if ( metadata?.type === 'METRIC_RATIO' ) {
			tooltipData = numberFormat( currentMonth, { style: 'percent' } );
		}

		const statInfo = sprintf(
			/* translators: %1$s: selected stat label, %2$s: numberic value of selected stat, %3$s: up or down arrow , %4$s: different change in percentage, %%: percent symbol */
			_x( '%1$s: <strong>%2$s</strong> <em>%3$s %4$s%%</em>', 'Stat information for AdSense dashbaord chart tooltip', 'google-site-kit' ),
			label,
			tooltipData,
			`<svg width="9" height="9" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" class="${ classnames( 'googlesitekit-change-arrow', {
				'googlesitekit-change-arrow--up': difference > 0,
				'googlesitekit-change-arrow--down': difference < 0,
			} ) }">
				<path d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z" fill="currentColor" />
			</svg>`,
			Math.abs( difference ).toFixed( 2 ).replace( /(.00|0)$/, '' ), // .replace( ... ) removes trailing zeros
		);

		dataMap.push( [
			new Date( currentDate ), // Copy the current date.
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

		currentDate.setDate( currentDate.getDate() + 1 );
		previousDate.setDate( previousDate.getDate() + 1 );
	}

	return dataMap;
}
