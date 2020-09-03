/**
 * Publisher wins initialization.
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
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getTimeInSeconds, getQueryParameter, getModulesData } from '../../util';
import { userReportDataDefaults, overviewReportDataDefaults } from '../../modules/analytics/util';
import { TYPE_MODULES } from '../data';
import * as publisherWinCallbacks from './callbacks';

const notification = getQueryParameter( 'notification' );

if ( 'authentication_success' !== notification && 'authentication_failure' !== notification ) {
	addFilter( 'googlesitekit.winCallbacks',
		'googlesitekit.publisherwinCallbacks',
		( callbacks ) => {
			return { ...callbacks, ...publisherWinCallbacks };
		} );

	/**
	 * Add components to the Site Kit Dashboard Win Notifications.
	 */
	addFilter( 'googlesitekit.WinsNotificationsRequest',
		'googlesitekit.PublisherWinsNotification',
		( wins ) => {
			const data = {
				identifier: 'first-post-win',
			};
			wins.push( data );
			return wins;
		}, 1 );

	/*
	 * IMPORTANT: The request definition within the withData objects below must
	 * exactly match existing requests actually made from the dashboard. That
	 * is because publisher wins at this point should not trigger any extra
	 * requests, they should continue to retrieve their information from
	 * existing API responses.
	 *
	 * TODO: As the dashboard requests are being migrated to the new API layer,
	 * we will need to make sure the cache key lookup here works with cache
	 * keys created by the new API layer too.
	 */
	addFilter( 'googlesitekit.WinsNotificationsRequest',
		'googlesitekit.PublisherWinsNotification',
		( wins ) => {
			const data = {
				identifier: 'publishing-win',
				withData: {
					// DO NOT just change this, see above comment.
					type: TYPE_MODULES,
					identifier: 'search-console',
					datapoint: 'searchanalytics',
					data: {
						url: global._googlesitekitLegacyData.permaLink,
						dimensions: 'date',
						compareDateRanges: true,
					},
					priority: 1,
					maxAge: getTimeInSeconds( 'day' ),
					context: 'Dashboard',
				},
			};
			wins.push( data );
			return wins;
		}, 1 );

	addFilter( 'googlesitekit.WinsNotificationsRequest',
		'googlesitekit.PublisherWinsNotification',
		( wins ) => {
			const data = {
				identifier: 'total-stats',
				withData: {
					// DO NOT just change this, see above comment.
					type: TYPE_MODULES,
					identifier: 'search-console',
					datapoint: 'searchanalytics',
					data: {
						url: global._googlesitekitLegacyData.permaLink,
						dimensions: 'date',
						compareDateRanges: true,
					},
					priority: 1,
					maxAge: getTimeInSeconds( 'day' ),
					context: 'Dashboard',
				},
			};
			wins.push( data );
			return wins;
		}, 2 );

	const modulesData = getModulesData();
	if ( modulesData.analytics.active ) {
		addFilter( 'googlesitekit.WinsNotificationsRequest',
			'googlesitekit.PublisherWinsNotification',
			( wins ) => {
				const data = {
					identifier: 'pageview-increase',
					withData: {
						// DO NOT just change this, see above comment.
						type: TYPE_MODULES,
						identifier: 'analytics',
						datapoint: 'report',
						data: {
							...overviewReportDataDefaults,
							url: global._googlesitekitLegacyData.permaLink,
						},
						priority: 1,
						maxAge: getTimeInSeconds( 'day' ),
						context: 'Dashboard',
					},
				};
				wins.push( data );
				return wins;
			}, 2 );

		addFilter( 'googlesitekit.WinsNotificationsRequest',
			'googlesitekit.PublisherWinsNotification',
			( wins ) => {
				const data = {
					identifier: 'traffic-increase',
					withData: {
						// DO NOT just change this, see above comment.
						type: TYPE_MODULES,
						identifier: 'analytics',
						datapoint: 'report',
						data: {
							...userReportDataDefaults,
							url: global._googlesitekitLegacyData.permaLink,
						},
						priority: 1,
						maxAge: getTimeInSeconds( 'day' ),
						context: 'Dashboard',
					},
				};
				wins.push( data );
				return wins;
			}, 2 );
	}
}

