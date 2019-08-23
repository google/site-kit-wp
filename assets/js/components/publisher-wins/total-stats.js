/**
 * totalStats function.
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
import { extractSearchConsoleDashboardData } from 'GoogleModules/search-console/dashboard/util';
import { getTimeInSeconds, getDaysBetweenDates } from 'GoogleUtil';

const { __ } = wp.i18n;

const totalStats = ( data, id ) => {
	if ( 5 >= parseInt( googlesitekit.admin.newSitePosts, 10 ) ) {
		return false;
	}

	if ( ! data || ! data.rows ) {
		return false;
	}

	let dataBlocks = [];
	let description = __( 'Here are some high level stats', 'google-site-kit' );

	if ( data && data.rows ) {
		const processedData = extractSearchConsoleDashboardData( data );

		const {
			totalClicks,
			totalClicksChange,
			totalImpressions,
			totalImpressionsChange,
			averageCTR,
			averageCTRChange,
		} = processedData;

		if ( 0 < totalClicksChange && 0 < totalImpressionsChange && 0 < averageCTRChange ) {
			description = `${ __( 'Last month was great!', 'google-site-kit' ) }. ${ description }`;
		}

		dataBlocks = [
			{
				title: __( 'Total Clicks', 'google-site-kit' ),
				datapoint: totalClicks,
				datapointUnit: '',
				change: totalClicksChange,
				changeDataUnit: '%',
				period: __( 'for month', 'google-site-kit' ),
			},
			{
				title: __( 'Total Impressions', 'google-site-kit' ),
				datapoint: totalImpressions,
				datapointUnit: '',
				change: totalImpressionsChange,
				changeDataUnit: '%',
				period: __( 'for month', 'google-site-kit' ),
			},
			{
				title: __( 'Average CTR', 'google-site-kit' ),
				datapoint: averageCTR,
				datapointUnit: '%',
				change: averageCTRChange,
				changeDataUnit: '%',
				period: __( 'for month', 'google-site-kit' ),
			},
		];
	}

	// Get days left for end of month to set dismiss expiration, notifications shows at beggining of the month.
	const currentDate = new Date();
	const lastDayOfMonth = new Date( currentDate.getFullYear(), currentDate.getMonth() + 1, 0 );
	const days = getDaysBetweenDates( currentDate, lastDayOfMonth ) + 1;

	return {
		id,
		title: __( 'Welcome Back!', 'google-site-kit' ),
		description,
		format: 'large',
		winImage: `${ googlesitekit.admin.assetsRoot }images/g-win.png`,
		blockData: dataBlocks,
		type: 'win-stats',
		storageType: 'localStorage',
		dismissExpires: getTimeInSeconds( 'day' ) * days,
		showOnce: true,
	};
};

export default totalStats;
