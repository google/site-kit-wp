/**
 * publishingWin function.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { extractSearchConsoleDashboardData } from '../../modules/search-console/util';
import { getModulesData } from '../../util';

const publishingWin = ( data, id ) => {
	// Only display if site is considered new (determined during activation, based on post count).
	if ( 5 !== parseInt( global._googlesitekitLegacyData.admin.newSitePosts, 10 ) ) {
		return false;
	}

	if ( ! Array.isArray( data ) ) {
		return false;
	}

	let message = __( 'That’s out of this world.', 'google-site-kit' );
	let dataBlocks = [];

	const modulesData = getModulesData();
	if ( modulesData[ 'search-console' ] && modulesData[ 'search-console' ].active && data ) {
		const processedData = extractSearchConsoleDashboardData( data );

		const {
			totalClicks,
			totalImpressions,
			averageCTR,
		} = processedData;

		// Only display stats if they are relevant. If everything is 0, it's likely
		// because the Search Console property is entirely new and hasn't aggregated
		// any data yet for the site.
		if ( 0 !== parseInt( totalClicks, 10 ) ||
			0 !== parseInt( totalImpressions, 10 ) ||
			0 !== parseInt( averageCTR, 10 ) ) {
			dataBlocks = [
				{
					title: __( 'Total Clicks', 'google-site-kit' ),
					datapoint: totalClicks,
					datapointUnit: '',
				},
				{
					title: __( 'Total Impressions', 'google-site-kit' ),
					datapoint: totalImpressions,
					datapointUnit: '',
				},
				{
					title: __( 'Average CTR', 'google-site-kit' ),
					datapoint: averageCTR,
					datapointUnit: '%',
				},
			];

			message = __( 'That’s out of this world. Here are the combined stats for your posts', 'google-site-kit' );
		}
	}

	return {
		id,
		title: __( 'Congrats on five published posts', 'google-site-kit' ),
		description: message,
		format: 'large',
		winImage: `${ global._googlesitekitLegacyData.admin.assetsRoot }images/rocket.png`,
		blockData: dataBlocks,
		type: 'win-stats',
		showOnce: true,
	};
};

export default publishingWin;
