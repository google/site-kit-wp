/**
 * Search Console dashboard utility functions.
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
import { changeToPercent, readableLargeNumber } from '../../../util';

function reduceSearchConsoleData( rows ) {
	const dataMap = [
		[
			{ type: 'string', label: 'Day' },
			{ type: 'number', label: 'Clicks' },
			{ type: 'number', label: 'Impressions' },
			{ type: 'number', label: 'CTR' },
			{ type: 'number', label: 'Position' },
		],
	];

	let totalClicks = 0;
	let totalImpressions = 0;
	let totalCTR = 0;
	let totalPosition = 0;
	const count = rows.length;
	each( rows, ( row ) => {
		const date = new Date( row.keys[ 0 ] );
		dataMap.push( [
			( date.getMonth() + 1 ) + '/' + date.getUTCDate(),
			row.clicks,
			row.impressions,
			row.ctr,
			row.position,
		] );
		totalClicks += row.clicks;
		totalImpressions += row.impressions;
		totalCTR += row.ctr;
		totalPosition += row.position;
	} );

	const totalClicksRaw = totalClicks;
	const totalImpressionsRaw = totalImpressions;

	totalClicks = readableLargeNumber( totalClicks );
	totalImpressions = readableLargeNumber( totalImpressions );

	const averageCTR = ( totalCTR / count * 100 ).toFixed( 1 );
	const averageCTRRaw = totalCTR / count;
	const averagePosition = ( totalPosition / count ).toFixed( 1 );

	return {
		dataMap,
		totalClicks,
		totalClicksRaw,
		totalImpressions,
		totalImpressionsRaw,
		averageCTR,
		averageCTRRaw,
		averagePosition,
	};
}

export const extractSearchConsoleDashboardData = ( rows ) => {
	// Split the results in two chunks.
	const half = Math.floor( rows.length / 2 );
	// Rows are from oldest to newest.
	const latestData = reduceSearchConsoleData( rows.slice( half ) );
	const olderData = reduceSearchConsoleData( rows.slice( 0, half ) );

	return {
		dataMap: latestData.dataMap,
		totalClicks: latestData.totalClicks,
		totalImpressions: latestData.totalImpressions,
		averageCTR: latestData.averageCTR,
		averagePosition: latestData.averagePosition,
		totalClicksChange: changeToPercent( olderData.totalClicksRaw, latestData.totalClicksRaw ),
		totalImpressionsChange: changeToPercent( olderData.totalImpressionsRaw, latestData.totalImpressionsRaw ),
		averageCTRChange: changeToPercent( olderData.averageCTRRaw, latestData.averageCTRRaw ),
		averagePositionChange: changeToPercent( olderData.averagePosition, latestData.averagePosition ),
	};
};

/**
 * Check for Zero data from Search Console API.
 *
 * @param {Object} data The data returned from the Search Console API call.
 * @return {boolean} Indicates zero data was returned from Search Console API call.
 */
export const isDataZeroSearchConsole = ( data ) => {
	if ( ! data.length ) {
		return true;
	}

	const processedData = extractSearchConsoleDashboardData( data );

	const {
		totalClicks,
		totalImpressions,
		averageCTR,
		averagePosition,
	} = processedData;

	return (
		0 === parseInt( totalClicks ) &&
			0 === parseInt( totalImpressions ) &&
			0 === parseInt( averageCTR ) &&
			0 === parseInt( averagePosition )
	);
};
