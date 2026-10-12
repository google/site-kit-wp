/**
 * Latest content row joining utility.
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
 * Internal dependencies
 */
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { Report } from '@/js/modules/analytics-4/datastore/types';

/**
 * A recently published post or product with its Analytics metrics.
 *
 * @since n.e.x.t
 */
export interface LatestContentRow extends RecentContentItem {
	/** The `screenPageViews` metric, or `0` when the report has no row for the path. */
	pageviews: number;
	/** The `sessions` metric, or `0` when the report has no row for the path. */
	sessions: number;
	/** The `engagedSessions` metric, or `0` when the report has no row for the path. */
	engagedSessions: number;
	/** The `averageSessionDuration` metric in seconds, or `0` when the report has no row for the path. */
	averageSessionDuration: number;
}

/**
 * Left-joins Analytics report rows onto recently published posts by path.
 *
 * Keeps every post in the order given, fills in zeros for a post the report
 * has no row for, and ignores report rows that match no post.
 *
 * @since n.e.x.t
 *
 * @param recentContent The posts and products, newest first.
 * @param report        The report with the `pagePath` dimension and the `screenPageViews`, `sessions`, `engagedSessions` and `averageSessionDuration` metrics, in that order.
 * @return The rows for the Latest content table.
 */
export function joinLatestContentRows(
	recentContent: RecentContentItem[],
	report?: Report
): LatestContentRow[] {
	const metricsByPath = new Map< string, number[] >();

	report?.rows?.forEach( ( { dimensionValues, metricValues } ) => {
		const pagePath = dimensionValues?.[ 0 ]?.value;

		if ( pagePath !== undefined ) {
			metricsByPath.set(
				pagePath,
				( metricValues ?? [] ).map( ( { value } ) => Number( value ) )
			);
		}
	} );

	return recentContent.map( ( item ) => {
		const [
			pageviews = 0,
			sessions = 0,
			engagedSessions = 0,
			averageSessionDuration = 0,
		] = metricsByPath.get( item.pagePath ) ?? [];

		return {
			...item,
			pageviews,
			sessions,
			engagedSessions,
			averageSessionDuration,
		};
	} );
}
