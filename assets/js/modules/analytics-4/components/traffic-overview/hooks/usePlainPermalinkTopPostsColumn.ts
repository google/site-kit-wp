/**
 * Traffic Overview `usePlainPermalinkTopPostsColumn` hook.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Select,
	useDispatch,
	useInViewSelect,
	useSelect,
} from 'googlesitekit-data';
import { TableTileRow } from '@/js/modules/analytics-4/components/common/tiles';
import { RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	FRESH_DATA_FETCH_OPTIONS,
	getTopChannelsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import { getMetricCount } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { PlainPermalinkTopPosts } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ErrorObject } from '@/js/util/errors';
import { useFreshDataDateRange } from './useFreshDataDateRange';
import { useRecentTrafficBreakdownReport } from './useRecentTrafficBreakdownReport';

interface PlainPermalinkTopPostsColumn {
	/** The rows the column renders, one for each post, each with its share of the visitors the columns count. */
	rows: TableTileRow[];
	/** `true` until the request for the posts finishes, whether it succeeded or failed. */
	loading: boolean;
	/** The error of the request for the posts, or `undefined` when it hasn't failed. */
	error?: ErrorObject;
	/** Sends the request for the posts again. */
	retry: () => void;
	/** The message the column shows with no rows where the report has visitors, or `undefined` for the default message, which says the site had no visitors. */
	zeroState?: string;
}

/**
 * Builds the rows of the "Top posts by visitors" column on a site with plain permalinks, which has no permalink structure.
 *
 * @since n.e.x.t
 *
 * @return {Object} The column's rows, its loading state, its error, a function that requests the posts again, and its zero state message.
 */
export function usePlainPermalinkTopPostsColumn(): PlainPermalinkTopPostsColumn {
	const dateRange = useFreshDataDateRange();

	const options = useMemo(
		() => ( { ...dateRange, limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS } ),
		[ dateRange ]
	);

	const topPosts = useInViewSelect< PlainPermalinkTopPosts | undefined >(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPlainPermalinkTopPosts(
				options,
				FRESH_DATA_FETCH_OPTIONS
			),
		[ options ]
	);

	const loading = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getPlainPermalinkTopPosts',
				[ options, FRESH_DATA_FETCH_OPTIONS ]
			),
		[ topPosts, options ]
	);

	// The fetch store saves the error under the options alone.
	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getPlainPermalinkTopPosts',
				[ options ]
			),
		[ topPosts, options ]
	);

	const { invalidateResolution } = useDispatch( MODULES_ANALYTICS_4 );

	const retry = useCallback( () => {
		invalidateResolution( 'getPlainPermalinkTopPosts', [
			options,
			FRESH_DATA_FETCH_OPTIONS,
		] );
	}, [ invalidateResolution, options ] );

	const { report: channelsReport } = useRecentTrafficBreakdownReport(
		getTopChannelsReportOptions
	);

	const rows = useMemo( () => {
		if ( ! topPosts ) {
			return [];
		}

		// The server returns only posts with visitors, most first, so
		// `getRecentTrafficBreakdownRows()` keeps each row at the index of
		// its post.
		return getRecentTrafficBreakdownRows(
			{
				rows: topPosts.rows.map(
					( { title, pagePath, visitors } ) => ( {
						dimensionValues: [ { value: title || pagePath } ],
						metricValues: [ { value: String( visitors ) } ],
					} )
				),
			},
			getMetricCount( channelsReport?.totals?.[ 0 ] )
		).map( ( row, index ) => ( {
			...row,
			url: topPosts.rows[ index ].url,
		} ) );
	}, [ topPosts, channelsReport ] );

	return {
		rows,
		loading,
		error,
		retry,
		zeroState:
			topPosts && topPosts.total > 0
				? __(
						'No data to display: your posts haven’t received any visitors yet',
						'google-site-kit'
				  )
				: undefined,
	};
}
