/**
 * Traffic Overview report utilities.
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
import { ReportRow } from '@/js/modules/analytics-4/datastore/types';

/**
 * Reads a row's metric value.
 *
 * The API returns metric values as strings.
 *
 * @since 1.191.0
 *
 * @param {Object} [row]   A report row, which is `undefined` while the report loads.
 * @param {number} [index] The index of the metric in the row. Defaults to the first metric.
 * @return {number} The metric value, or `0` when it is missing or not a number.
 */
export function getMetricValue( row?: ReportRow, index = 0 ): number {
	return Number( row?.metricValues?.[ index ]?.value ) || 0;
}

/**
 * Reads the count of a metric in a report row, such as its visitors.
 *
 * @since 1.188.0
 * @since 1.191.0 Renamed from `getVisitors()`, exported, and takes an optional row and the index of the metric to read.
 *
 * @param {Object} [row]         Optional. A report row.
 * @param {number} [metricIndex] Optional. The index of the metric in the row's metric values. Default `0`.
 * @return {number} The count, or `0` when the row has no value for the metric or the value isn't a number.
 */
export function getMetricCount( row?: ReportRow, metricIndex = 0 ): number {
	return parseInt( row?.metricValues?.[ metricIndex ]?.value ?? '', 10 ) || 0;
}

/**
 * Gets the URL of a page on the site from the page path in an Analytics report.
 *
 * Analytics can record a value that isn't a path, such as `(not set)`, or a
 * spam path that resolves to another site, such as `//example.org/` or
 * `/\example.org/`. The function returns `undefined` for both, so a link
 * never leaves the site.
 *
 * @since 1.191.0
 *
 * @param {string} siteURL  The URL of the site, such as `https://example.com`.
 * @param {string} pagePath The page path, such as `/hello-world/`.
 * @return {(string|undefined)} The URL of the page, or `undefined` when the page path isn't a path on the site.
 */
export function getPageURL(
	siteURL: string,
	pagePath: string
): string | undefined {
	if ( ! pagePath.startsWith( '/' ) ) {
		return undefined;
	}

	try {
		const site = new URL( siteURL );
		const page = new URL( pagePath, site );

		return page.origin === site.origin ? page.href : undefined;
	} catch {
		return undefined;
	}
}
