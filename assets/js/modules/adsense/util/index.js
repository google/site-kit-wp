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
import { each } from 'lodash';

/**
 * Internal dependencies
 */
import { getModulesData } from '../../../util';
import { analyticsAdsenseReportDataDefaults } from '../../analytics/util';
import data, { TYPE_MODULES } from '../../../components/data';

export * from './parsing';
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
 * Check if adsense is connected from Analytics API.
 *
 * @return {Promise} Resolves to a boolean, whether or not AdSense is connected.
 */
export const isAdsenseConnectedAnalytics = async () => {
	const modulesData = getModulesData();

	const { active: adsenseActive } = modulesData.adsense;
	const { active: analyticsActive } = modulesData.analytics;

	let adsenseConnect = true;

	if ( adsenseActive && analyticsActive ) {
		await data.get( TYPE_MODULES, 'analytics', 'report', analyticsAdsenseReportDataDefaults ).then( ( res ) => {
			if ( res ) {
				adsenseConnect = true;
			}
		} ).catch( ( err ) => {
			if ( 400 === err.code && 'INVALID_ARGUMENT' === err.message ) {
				adsenseConnect = false;
			}
		} );
	}

	return new Promise( ( resolve ) => {
		resolve( adsenseConnect );
	} );
};

/**
 * Check for any value higher than 0 in values from AdSense data.
 *
 * @param {Array} adSenseData Data returned from the AdSense.
 * @param {string} datapoint Datapoint requested.
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
