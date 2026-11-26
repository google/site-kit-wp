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
	BENCHMARKING_KEY_FACTOR_SHARE_BASES,
} from './constants';

export type BenchmarkingKeyFactorKind =
	typeof BENCHMARKING_KEY_FACTOR_KINDS[ number ];

export type BenchmarkingKeyFactorAttributeKind =
	typeof BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS[ number ];

export type BenchmarkingKeyFactorShareBasis =
	typeof BENCHMARKING_KEY_FACTOR_SHARE_BASES[ number ];

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
	/** The fewest visits that are normal for that day, or null on every day of a date range without a band. */
	expectedMin: number | null;
	/** The most visits that are normal for that day, or null on every day of a date range without a band. */
	expectedMax: number | null;
}

/**
 * Which parts of the typical traffic view the date range has, as the Site Kit
 * service's rules decide them on the server. Each part waits for its own
 * history, counted from the site's first day with recorded traffic.
 */
export interface BenchmarkingAvailability {
	/** Whether the date range is shorter than 7 days, too short for the key factors and the generated insight. */
	rangeTooShort: boolean;
	/** Whether every day of the date range has its typical range, so the chart draws the band. */
	bandAvailable: boolean;
	/** The first last day of a date range of this length with the band, as `YYYY-MM-DD`, or null when the site has no recorded traffic. */
	bandAvailableFrom: string | null;
	/** Whether the date range has the key factors: it is long enough, and every day of the range before it has recorded traffic. */
	keyFactorsAvailable: boolean;
	/** The first last day of a date range of this length with the key factors, as `YYYY-MM-DD`, or null when the site has no recorded traffic. */
	keyFactorsAvailableFrom: string | null;
	/** Whether the panel asks for the generated insight: with the key factors, since the insight's driver describes the change they show, and for a date range of up to 364 days. */
	insightRequestAllowed: boolean;
	/** Whether the panel shows the insight's analysis, which compares the visits with the typical range: with the band and the request. */
	performanceInsightAvailable: boolean;
	/** Whether last year's two windows are in the site's history, so the band can mention the season. */
	lastYearAvailable: boolean;
	/** Whether the date range is longer than 364 days, too long for the generated insight, which the Site Kit service writes for up to 364 days. */
	rangeTooLong: boolean;
	/** Whether the site has too little traffic for the band, the key factors and the generated insight: under 100 visits per 28 days over the 56 days that end on the range's last day. The range then has none of them, however long the site's history. */
	lowTraffic: boolean;
}

export interface BenchmarkingKeyFactorAttribute {
	/** The attribute's kind, such as `DEVICE` for the device behind a `Direct` card. */
	kind: BenchmarkingKeyFactorAttributeKind;
	/**
	 * The attribute's name, or null when the response carried none: a page
	 * path for a `LANDING_PAGE`, which its link is built on, or the channel's
	 * name for a `TRAFFIC_CHANNEL`.
	 */
	label: string | null;
	/** Visits in the date range the reader chose, or clicks for a `SEARCH_KEYWORD`. */
	current: number;
	/** Visits in the range before it, or clicks for a `SEARCH_KEYWORD`. */
	previous: number;
	/**
	 * The attribute's share, in percent, as the generated insight reads it:
	 * of its card's change, of the site's search clicks for a
	 * `SEARCH_KEYWORD`, or of the paid channels' movement for a
	 * `TRAFFIC_CHANNEL` of the paid group. `0` without one.
	 */
	sharePct: number;
	/**
	 * Whether the attribute moved further than its card, the same way,
	 * because the card's other parts moved the other way. It then has no
	 * share. For a `SEARCH_KEYWORD`, whether its clicks moved against the
	 * site's search clicks or further than their change, because other
	 * queries moved the other way. Left out otherwise.
	 */
	oversized?: boolean;
	/**
	 * The page's title, when it is known, on a `LANDING_PAGE` that names a
	 * page other than the homepage. The attribute shows it in place of the
	 * path in `label`. Left out otherwise.
	 */
	title?: string;
	/**
	 * Whether the site's search clicks are unknown, on a `SEARCH_KEYWORD`, so
	 * its change is no share of them. Left out otherwise.
	 */
	noSearchClicks?: boolean;
}

export interface BenchmarkingKeyFactorParentChannel {
	/** The channel's name, such as `Referral`. */
	label: string;
	/** The channel's change in visits, negative for a drop. */
	change: number;
}

export interface BenchmarkingKeyFactor {
	/**
	 * The kind of driver behind the card's change: a `CHANNEL`, the paid
	 * channels as one `CHANNEL_GROUP`, or a part of a channel that carried most
	 * of its change, a `CONTENT` post, a `REFERRING_SITE` or a `CAMPAIGN`. A
	 * `CONTENT` card can also be a page that brought visits from several
	 * channels, with a `TRAFFIC_CHANNEL` attribute for each of them.
	 */
	kind: BenchmarkingKeyFactorKind;
	/** The driver's name, or null when the response carried none. */
	label: string | null;
	/** Visits in the date range the reader chose. */
	current: number;
	/** Visits in the range before it. */
	previous: number;
	/**
	 * The card's share, in percent, as the generated insight reads it: of the
	 * site's visits when traffic was steady, and otherwise of the change it is
	 * part of, such as the site's change in its direction, or its channel's
	 * change for a part of a channel. `0` on a card without a basis.
	 */
	sharePct: number;
	/**
	 * What `sharePct` is of, as the Site Kit service names it, such as
	 * `PARENT_CHANNEL` for a part of a channel that took the channel's card.
	 * Left out when the response carried none, such as for a channel on a
	 * period whose total didn't change notably.
	 */
	shareBasis?: BenchmarkingKeyFactorShareBasis;
	/**
	 * The channel a part of a channel took the place of: on `PARENT_CHANNEL`,
	 * the channel whose change `sharePct` is a share of, and on any other
	 * basis, or without one, the channel the part moved further than. Left
	 * out on any other card.
	 */
	parentChannel?: BenchmarkingKeyFactorParentChannel;
	/**
	 * Whether the change of a channel's card without attributes was spread
	 * across many pages, none of which carried a notable part of it. Left
	 * out on any other card.
	 */
	spreadAcrossPages?: boolean;
	/**
	 * Whether a channel's card, or the paid channels', is for its pages other
	 * than the page that brought visits from several channels, which took a
	 * card of its own. `label` is then the channel's own name. Left out
	 * otherwise.
	 */
	otherPages?: boolean;
	/** The values inside the driver that carried its change, in the order the response ranked them. */
	attributes: BenchmarkingKeyFactorAttribute[];
	/** The page's path, such as `/how-to-plant-garlic/`, on a `CONTENT` card. */
	url?: string;
}

export interface BenchmarkingContentMarkerPost {
	/** The post's title. */
	title: string;
	/** The post's path, such as `/how-to-plant-garlic/`. */
	url: string;
}

export interface BenchmarkingContentMarker {
	/** The day the posts were published, as `YYYY-MM-DD`. */
	date: string;
	/** The posts published on that day, the post with the most visits in the date range first. */
	posts: BenchmarkingContentMarkerPost[];
}

export interface DecodedBenchmarkingResponse {
	/** The two period totals. */
	visits: BenchmarkingVisits;
	/** One row per day, in ascending date order. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
	/** Which parts of the typical traffic view the date range has. */
	availability: BenchmarkingAvailability;
	/**
	 * The number of days of traffic the band of the date range's last day is
	 * fitted on, at most 365, which the band's tooltip names in weeks. Null
	 * when the date range has no band.
	 */
	bandReferenceDays: number | null;
	/** The key factor cards, in the order the response ranked them. */
	keyFactors: BenchmarkingKeyFactor[];
	/**
	 * Whether traffic was steady: no channel changed notably compared with the
	 * previous period. The key factor cards are then the channels with the most
	 * visits, each with its share of the site's visits as `sharePct`.
	 */
	steadyTraffic: boolean;
	/**
	 * The days in the date range with the posts that brought it the most visits,
	 * oldest first. Empty while the post date custom dimension has no data.
	 */
	contentMarkers: BenchmarkingContentMarker[];
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
	/** The period's visits, and how they compare with what is usual for the site. */
	analysis: string | null;
	/** The change against the previous period and what carried it, where `**` pairs mark the names it highlights. */
	driver: string | null;
	/** The ID of the generation, which a vote on the insight names. */
	interactionID: string | null;
	/** The model that wrote the insight. */
	modelVersion: string | null;
}
