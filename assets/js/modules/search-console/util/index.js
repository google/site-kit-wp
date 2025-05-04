/**
 * Search Console dashboard utility functions.
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
import { each, round } from 'lodash';

/**
 * Internal dependencies
 */
import { calculateChange, partitionReport, stringToDate } from '../../../util';

export * from './is-zero-report';
export * from './site-stats-data';
export * from './report-date-range-args';
export * from './validation';

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
		const date = stringToDate( row.keys[ 0 ] );
		dataMap.push( [
			date.getMonth() + 1 + '/' + date.getUTCDate(),
			row.clicks,
			row.impressions,
			round( row.ctr, 3 ),
			round( row.position, 3 ),
		] );
		totalClicks += row.clicks;
		totalImpressions += row.impressions;
		totalCTR += row.ctr;
		totalPosition += row.position;
	} );

	// Do not divide by zero.
	const averageCTR = count > 0 ? totalCTR / count : 0.0;
	const averagePosition = count > 0 ? totalPosition / count : 0.0;

	return {
		dataMap,
		totalClicks,
		totalImpressions,
		averageCTR,
		averagePosition,
	};
}

export const extractSearchConsoleDashboardData = ( rows, dateRangeLength ) => {
	const { compareRange, currentRange } = partitionReport( rows, {
		dateRangeLength,
	} );
	const latestData = reduceSearchConsoleData( currentRange );
	const olderData = reduceSearchConsoleData( compareRange );

	return {
		dataMap: latestData.dataMap,
		totalClicks: latestData.totalClicks,
		totalImpressions: latestData.totalImpressions,
		averageCTR: latestData.averageCTR,
		averagePosition: latestData.averagePosition,
		totalClicksChange: calculateChange(
			olderData.totalClicks,
			latestData.totalClicks
		),
		totalImpressionsChange: calculateChange(
			olderData.totalImpressions,
			latestData.totalImpressions
		),
		averageCTRChange: calculateChange(
			olderData.averageCTR,
			latestData.averageCTR
		),
		averagePositionChange: calculateChange(
			olderData.averagePosition,
			latestData.averagePosition
		),
	};
};
