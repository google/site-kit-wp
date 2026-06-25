/**
 * Helpers for report cache keys.
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
 * External dependencies
 */
import { isPlainObject, omit } from 'lodash';

/**
 * Internal dependencies
 */
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { stringifyObject } from './stringify';

/**
 * Report options shared by the Analytics 4, Search Console, and AdSense stores.
 *
 * Analytics 4 passes `ReportOptions`. The type also allows any object, because
 * the Search Console and AdSense stores pass other shapes. Search Console has
 * no `metrics`, which `ReportOptions` requires, and AdSense uses a different
 * `orderby`.
 *
 * @since n.e.x.t
 */
export type ReportRequestOptions = {
	reportID?: string;
} & ( ReportOptions | { [ key: string ]: unknown } );

/**
 * Removes `reportID` from report options.
 *
 * `reportID` is only a label that says which part of the plugin asked for the
 * report, and it does not change the report data. So two calls that differ
 * only in `reportID` ask for the same report. They can share one request and
 * one cache entry. Returns the value unchanged when it is not a plain object,
 * so option validation still sees the original input.
 *
 * @since n.e.x.t
 *
 * @param options Report options as the caller passed them.
 * @return Report options without `reportID`.
 */
export function getCacheableReportOptions(
	options?: ReportRequestOptions
): ReportRequestOptions | undefined {
	if ( ! isPlainObject( options ) ) {
		return options;
	}

	return omit( options, [ 'reportID' ] ) as ReportRequestOptions;
}

/**
 * Builds the cache key for a report from its options.
 *
 * Removes `reportID` first, then turns the rest of the options into a stable
 * string. So two calls that differ only in `reportID` get the same key, and
 * they share one saved report and one request.
 *
 * @since n.e.x.t
 *
 * @param options Report options as the caller passed them.
 * @return Cache key for the saved report and the running request map.
 */
export function getReportCacheKey( options?: ReportRequestOptions ): string {
	return stringifyObject(
		getCacheableReportOptions( options ) as ReportRequestOptions
	);
}
