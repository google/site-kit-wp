/**
 * Benchmarking response decoded shapes.
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
import { BENCHMARKING_DIMENSION_CODES } from './constants';

export type BenchmarkingDimensionCode =
	typeof BENCHMARKING_DIMENSION_CODES[ number ];

export interface BenchmarkingVisitors {
	/** Visitors in the date range the reader chose. */
	current: number;
	/** Visitors in the range before it. */
	previous: number;
}

export interface BenchmarkingDailyTrafficRow {
	/** The day, as `YYYY-MM-DD`. */
	date: string;
	/** Visitors on that day. */
	visitors: number;
}

export interface BenchmarkingValueRow {
	/** The row's name, or null when the response carried none. */
	label: string | null;
	/** Visitors in the date range the reader chose. */
	current: number;
	/** Visitors in the range before it. */
	previous: number;
}

export interface BenchmarkingSearchQueryRow extends BenchmarkingValueRow {
	/** Average search position in the date range the reader chose. */
	positionCurrent: number | null;
	/** Average search position in the range before it. */
	positionPrevious: number | null;
}

export interface BenchmarkingContentRow {
	/** The page's URL, or null when the response carried none. */
	url: string | null;
	/** The page's title, or null when the response carried none. */
	title: string | null;
	/** Visitors the page received. */
	visitors: number;
	/** Days between the page's publication and the end of the date range. */
	publishedDaysAgo: number;
}

export interface BenchmarkingContextualData {
	channels?: BenchmarkingValueRow[];
	devices?: BenchmarkingValueRow[];
	visitorMix?: BenchmarkingValueRow[];
	referrers?: BenchmarkingValueRow[];
	searchQueries?: BenchmarkingSearchQueryRow[];
	content?: BenchmarkingContentRow[];
	categories?: BenchmarkingValueRow[];
}

export interface DecodedBenchmarkingResponse {
	/** The two period totals. */
	visitors: BenchmarkingVisitors;
	/** One row per day, in ascending date order. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
	/** The dimension codes, in the order the response ranked them. */
	dimensions: BenchmarkingDimensionCode[];
	/** The dimension rows, keyed by dimension. */
	contextualData: BenchmarkingContextualData;
}
