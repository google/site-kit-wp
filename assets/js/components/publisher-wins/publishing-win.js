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
 * External dependencies
 */
import { extractSearchConsoleDashboardData } from 'GoogleModules/search-console/dashboard/util';
import { readableLargeNumber } from 'GoogleUtil';

const { __ } = wp.i18n;

const publishingWin = ( data, id ) => {
	const showNotification = 5 === parseInt( googlesitekit.admin.newSitePosts, 10 );

	if ( ! showNotification ) {
		return false;
	}

	let message = __( "That's out of this world.", 'google-site-kit' );
	let dataBlocks = [];

	if ( googlesitekit.modules[ 'search-console' ] && googlesitekit.modules[ 'search-console' ].active && data ) {
		const processedData = extractSearchConsoleDashboardData( data );

		const {
			totalClicks,
			totalImpressions,
			averageCTR,
		} = processedData;

		dataBlocks = [
			{
				title: __( 'Total Impressions', 'google-site-kit' ),
				datapoint: readableLargeNumber( totalImpressions ),
				datapointUnit: '',
			},
			{
				title: __( 'Total Clicks', 'google-site-kit' ),
				datapoint: readableLargeNumber( totalClicks ),
				datapointUnit: '',
			},
			{
				title: __( 'Average CTR', 'google-site-kit' ),
				datapoint: averageCTR,
				datapointUnit: '%',
			},
		];

		message = __( "That's out of this world. Here are the combined stats for your posts", 'google-site-kit' );
	}

	return {
		id,
		title: __( 'Congrats on five published posts', 'google-site-kit' ),
		description: message,
		format: 'large',
		winImage: `${ googlesitekit.admin.assetsRoot }images/rocket.png`,
		blockData: dataBlocks,
		type: 'win-stats',
		showOnce: true,
	};
};

export default publishingWin;
