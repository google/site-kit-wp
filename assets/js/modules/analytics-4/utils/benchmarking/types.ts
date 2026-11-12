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
import {
	BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS,
	BENCHMARKING_KEY_FACTOR_KINDS,
} from './constants';

export type BenchmarkingKeyFactorKind =
	typeof BENCHMARKING_KEY_FACTOR_KINDS[ number ];

export type BenchmarkingKeyFactorAttributeKind =
	typeof BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS[ number ];

export interface BenchmarkingVisits {
	/** Visits in the date range the reader chose. */
	current: number;
	/** Visits in the range before it. */
	previous: number;
}

export interface BenchmarkingDailyTrafficRow {
	/** The day, as `YYYY-MM-DD`. */
	date: string;
	/** Visits on that day. */
	visits: number;
	/** The fewest visits that are normal for that day, or null on a day without a band. */
	expectedMin: number | null;
	/** The most visits that are normal for that day, or null on a day without a band. */
	expectedMax: number | null;
}

export interface BenchmarkingKeyFactorAttribute {
	/** The attribute's kind, such as `DEVICE` for the device behind a `Direct` card. */
	kind: BenchmarkingKeyFactorAttributeKind;
	/** The attribute's name, or null when the response carried none. */
	label: string | null;
	/** Visits in the date range the reader chose. */
	current: number;
	/** Visits in the range before it. */
	previous: number;
	/** The percentage of the site's change, in the same direction, that the attribute accounts for. */
	sharePct: number;
}

export interface BenchmarkingKeyFactor {
	/** The kind of driver behind the card's change, such as `CHANNEL` or `CONTENT`. */
	kind: BenchmarkingKeyFactorKind;
	/** The driver's name, or null when the response carried none. */
	label: string | null;
	/** Visits in the date range the reader chose. */
	current: number;
	/** Visits in the range before it. */
	previous: number;
	/** The percentage of the site's change, in the same direction, that the card accounts for. */
	sharePct: number;
	/** The values inside the driver that carried its change, in the order the response ranked them. */
	attributes: BenchmarkingKeyFactorAttribute[];
}

export interface DecodedBenchmarkingResponse {
	/** The two period totals. */
	visits: BenchmarkingVisits;
	/** One row per day, in ascending date order. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
	/** The first day with recorded traffic, as `YYYY-MM-DD`, or null when the site has none. */
	firstTrafficDate: string | null;
	/** The key factor cards, in the order the response ranked them. */
	keyFactors: BenchmarkingKeyFactor[];
	/**
	 * The locale the generated insight is written in, such as `de_DE`, or null.
	 * Only a response of the `trafficInsights` feature has it.
	 */
	insightLocale?: string | null;
	/**
	 * The signed request the generated insight is written from, which the
	 * browser sends back unread, or null when there is no insight to request.
	 * Only a response of the `trafficInsights` feature has it.
	 */
	insightPayload?: string | null;
}

export interface BenchmarkingInsight {
	/**
	 * The service's label for the period, such as `ABOVE_EXPECTED.UP`. The set
	 * of labels is open, so a label may be one the plugin doesn't know.
	 */
	scenario: string | null;
	/** One sentence on how the period compares with what is usual for the site, or null when the service wrote none. */
	teaser: string | null;
	/** The period's visits, and how they compare with what is usual for the site. */
	analysis: string | null;
	/** The change against the previous period and what carried it, where `**` pairs mark the names it highlights. */
	driver: string | null;
	/** The ID of the generation, which a vote on the insight names. */
	interactionID: string | null;
	/** The model that wrote the insight. */
	modelVersion: string | null;
}
