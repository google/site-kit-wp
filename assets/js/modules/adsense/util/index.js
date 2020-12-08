/**
 * AdSense utility functions.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import each from 'lodash/each';

export * from './is-zero-report';
export * from './parsing';
export * from './site-stats-data';
export * from './status';
export * from './validation';
export * from './url';

export function reduceAdSenseData( rows ) {
	const dataMap = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'RPM' },
			{ type: 'number', label: 'Earnings' },
			{ type: 'number', label: 'Impressions' },
		],
	];

	each( rows, ( row ) => {
		const date = new Date( row[ 0 ] );
		dataMap.push( [
			date,
			row[ 2 ],
			row[ 1 ],
			row[ 3 ],
		] );
	} );

	return {
		dataMap,
	};
}

/**
 * Checks for any value higher than 0 in values from AdSense data.
 *
 * @since 1.0.0
 *
 * @param {Array}  adSenseData Data returned from the AdSense.
 * @param {string} datapoint   Datapoint requested.
 * @param {Object} dataRequest Request data object.
 * @return {boolean} Whether or not AdSense data is considered zero data.
 */
export const isDataZeroAdSense = ( adSenseData, datapoint, dataRequest ) => {
	// We only check the last 28 days of earnings because it is the most reliable data point to identify new setups:
	// only new accounts or accounts not showing ads would have zero earnings in the last 28 days.
	if ( ! dataRequest.data || ! dataRequest.data.dateRange || 'last-28-days' !== dataRequest.data.dateRange ) {
		return false;
	}

	let totals = [];
	if ( adSenseData.totals ) {
		totals = adSenseData.totals;
	}

	// Look for any value > 0.
	totals = totals.filter( ( total ) => {
		return 0 < total;
	} );
	return 0 === totals.length;
};
