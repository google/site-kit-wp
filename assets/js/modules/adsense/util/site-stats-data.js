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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Gets data for a Google Chart from an adesnse report.
 *
 * @since n.e.x.t
 *
 * @param {Object} current        A report object for the current period.
 * @param {Object} previous       A report object for the previous period.
 * @param {string} label          Metric label.
 * @param {number} selectedColumn Selected column index.
 * @return {Array.<Array.<number|string>>} Data array.
 */
export function getSiteStatsDataForGoogleChart( current, previous, label, selectedColumn = 1 ) {
	const dataMap = [
		[
			{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
			{ type: 'number', label },
			{ type: 'number', label: __( 'Previous period', 'google-site-kit' ) },
		],
	];

	if ( Array.isArray( current?.rows ) ) {
		current.rows.forEach( ( row ) => {
			const date = new Date( row[ 0 ] );
			dataMap.push( [
				date,
				row[ selectedColumn ],
				previous?.rows?.[ selectedColumn ],
			] );
		} );
	}

	return dataMap;
}
