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
import { getLocale, numFmt, calculateChange, getChartDifferenceArrow } from '../../../util';
import { getPreviousDate } from '../../../util/date-range/get-previous-date';

/**
 * Gets data for a Google chart from a Search Console report.
 *
 * @since 1.30.0
 * @since 1.34.0 Added `dateRangeLength` parameter.
 *
 * @param {Array}  current         Report rows for the current period.
 * @param {Array}  previous        Report rows for the previous period.
 * @param {string} label           Metric label.
 * @param {number} selectedColumn  Selected column index.
 * @param {number} dateRangeLength Date range length.
 * @return {Array.<Array.<number|string>>} Data array.
 */
export const getSiteStatsDataForGoogleChart = ( current, previous, label, selectedColumn, dateRangeLength ) => {
	const dataMap = [
		[
			{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
			{ type: 'string', role: 'tooltip', p: { html: true } },
			{ type: 'number', label },
			{ type: 'number', label: __( 'Previous period', 'google-site-kit' ) },
		],
	];

	const stringToDate = ( dateString ) => new Date( `${ dateString } 00:00:00` );
	const locale = getLocale();
	const localeDateOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	};

	current.forEach( ( currentDay, index ) => {
		const currentMonth = currentDay[ selectedColumn ];
		const currentDate = currentDay.keys[ 0 ];
		// Search Console does not provide rows from before the property was added
		// so we need to provide fallback values for the previous range which may not exist.
		const prevMonth = previous[ index ]?.[ selectedColumn ] || 0;
		const previousDate = previous[ index ]?.keys[ 0 ] ||
			getPreviousDate( currentDate, dateRangeLength );

		const dateRange = sprintf(
			/* translators: 1: date for user stats, 2: previous date for user stats comparison */
			_x( '%1$s vs %2$s', 'Date range for chart tooltip', 'google-site-kit' ),
			stringToDate( currentDate ).toLocaleDateString( locale, localeDateOptions ),
			stringToDate( previousDate ).toLocaleDateString( locale, localeDateOptions ),
		);
		const change = calculateChange( prevMonth, currentMonth );
		const difference = prevMonth !== 0
			? ( currentMonth / prevMonth ) - 1
			: 1; // if previous month has 0, we need to pretend it's 100% growth, thus the "difference" has to be 1
		const svgArrow = getChartDifferenceArrow( difference );
		const statInfo = sprintf(
			/* translators: 1: selected stat label, 2: numeric value of selected stat, 3: up or down arrow , 4: different change in percentage, %%: percent symbol */
			_x( '%1$s: <strong>%2$s</strong> <em>%3$s %4$s%%</em>', 'Stat information for chart tooltip', 'google-site-kit' ),
			label,
			Math.abs( currentMonth ).toFixed( 2 ).replace( /(.00|0)$/, '' ),
			svgArrow,
			numFmt( change ),
		);

		dataMap.push( [
			new Date( stringToDate( currentDate ) ),
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
	} );

	return dataMap;
};
