/**
 * Traffic Overview `useReportPageTitles` hook.
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
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useAnalyticsReportsData from '@/js/modules/analytics-4/components/widgets/utils/useAnalyticsReportsData';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { decodeAmpersand } from '@/js/modules/analytics-4/utils';
import {
	getPageTitleMap,
	getPageTitlesReportOptions,
} from '@/js/modules/analytics-4/utils/page-titles-report';

export interface PageTitles {
	/** The title of each page path that has one, such as `{ '/hello-world/': 'Hello world!' }`, or `undefined` until the titles load and after their request fails. */
	titles?: Record< string, string >;
	/** `true` while the titles of the page paths load. */
	loading: boolean;
}

/**
 * Resolves the titles that Analytics records for the given page paths.
 *
 * A page that Analytics has no title for has no title in `titles`. When the
 * request for the titles fails, no page path has a title.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} pagePaths       The page paths, such as `/hello-world/`. With none, the hook requests no titles.
 * @param {Object}        [reportOptions] Optional. The options of the report the page paths come from, which set the date range.
 * @return {Object} The titles, and whether they are loading.
 */
export function useReportPageTitles(
	pagePaths: string[],
	reportOptions?: ReportOptions
): PageTitles {
	const titlesReportOptions = useMemo(
		() =>
			pagePaths.length && reportOptions
				? getPageTitlesReportOptions( reportOptions, pagePaths )
				: undefined,
		[ pagePaths, reportOptions ]
	);

	const { report, loading, error } = useAnalyticsReportsData( {
		primaryOptions: titlesReportOptions,
	} );

	const titles = useMemo(
		() =>
			titlesReportOptions && ! loading && ! error
				? Object.fromEntries(
						Object.entries( getPageTitleMap( pagePaths, report ) )
							.map( ( [ pagePath, title ] ) => [
								pagePath,
								decodeAmpersand( title ).trim(),
							] )
							// `getPageTitleMap()` returns "(unknown)" as the title of
							// a page that Analytics has no title for.
							.filter(
								( [ , title ] ) =>
									title &&
									title !==
										__( '(unknown)', 'google-site-kit' )
							)
				  )
				: undefined,
		[ titlesReportOptions, loading, error, pagePaths, report ]
	);

	return {
		titles,
		loading: titlesReportOptions !== undefined && loading,
	};
}
