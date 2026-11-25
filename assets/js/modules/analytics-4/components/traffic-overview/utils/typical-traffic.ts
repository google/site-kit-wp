/**
 * Traffic Overview typical traffic utilities.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Report } from '@/js/modules/analytics-4/datastore/types';
import {
	BenchmarkingAvailability,
	BenchmarkingDailyTrafficRow,
	BenchmarkingVisits,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import { formatDate, getDateString, stringToDate } from '@/js/util';
import { getMetricValue } from './report';

export type TypicalTrafficAvailability = Pick<
	BenchmarkingAvailability,
	| 'rangeTooShort'
	| 'bandAvailable'
	| 'bandAvailableFrom'
	| 'keyFactorsAvailable'
	| 'keyFactorsAvailableFrom'
	| 'insightRequestAllowed'
	| 'performanceInsightAvailable'
	| 'lastYearAvailable'
	| 'rangeTooLong'
>;

/**
 * The days that decide whether a notice says when to check back for a part
 * of the typical traffic view that waits for history, or asks for a date range
 * that ends later.
 */
export interface TypicalTrafficNoticeDates {
	/** The last day of the selected date range, as `YYYY-MM-DD`. */
	endDate: string;
	/** The last day a date range can end on, as `YYYY-MM-DD`: today on the dashboard, and the day before in the PDF export, whose ranges end then. */
	latestSelectableDate: string;
}

export interface TrafficOverviewVisitsOptions {
	/** The benchmarking response for the selected range, or `undefined` while there is none. */
	benchmarkingResponse?: DecodedBenchmarkingResponse;
	/** Whether the request for the benchmarking response failed. */
	benchmarkingFailed: boolean;
	/** The report of visits on each day of the selected range, against the range before it, which the panel requests when the benchmarking request fails. */
	dailyVisitsReport?: Report;
	/** The first day of the selected range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the selected range, as `YYYY-MM-DD`. */
	endDate: string;
}

export interface TrafficOverviewVisits {
	/** The visits on each day of the selected range, with its typical range where the source has one. */
	dailyTraffic?: BenchmarkingDailyTrafficRow[];
	/** The visits over the selected range, and over the range before it. */
	totalVisits?: BenchmarkingVisits;
}

/**
 * The parts of the typical traffic view while the benchmarking response loads:
 * every part, so each keeps its placeholder until the response says otherwise,
 * and no notice that takes the place of a part: not the short-range or the
 * long-range notice, nor the days a waiting part arrives. The band's tooltip
 * shows with the band alone, so no history of last year either.
 */
const AVAILABILITY_WHILE_LOADING: TypicalTrafficAvailability = {
	rangeTooShort: false,
	bandAvailable: true,
	bandAvailableFrom: null,
	keyFactorsAvailable: true,
	keyFactorsAvailableFrom: null,
	insightRequestAllowed: true,
	performanceInsightAvailable: true,
	lastYearAvailable: false,
	rangeTooLong: false,
};

/**
 * Gets which parts of the typical traffic view the selected date range has.
 *
 * The server decides them by the rules of the Site Kit service's
 * `TypicalTrafficAvailabilityFor()`, which `Typical_Traffic_Availability`
 * ports, and sends them with the benchmarking response, so the panel reads
 * them rather than working them out again.
 *
 * @since n.e.x.t
 *
 * @param {Object} [benchmarkingResponse] Optional. The benchmarking response for the selected date range, or `undefined` while it loads.
 * @return {Object} Whether the range is too short for the key factors, whether it has the band and the key factors, the last day of the first range of its length with each, whether the panel asks for the generated insight, whether it shows the insight's analysis, and whether the site's history reaches the same time last year. Every part is `true`, with no days, and the range neither too short nor with last year's history, while the response loads.
 */
export function getTypicalTrafficAvailability(
	benchmarkingResponse?: DecodedBenchmarkingResponse
): TypicalTrafficAvailability {
	return benchmarkingResponse?.availability ?? AVAILABILITY_WHILE_LOADING;
}

/**
 * Gets the visits on each day of the selected range from the daily visits
 * report, in the shape the Typical Traffic Overview chart plots.
 *
 * The report leaves out a day without visits, so that day reads zero. No day
 * has a typical range.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report]  Optional. The daily visits report, `undefined` until the request has finished.
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array.<Object>} One row for each day of the range, oldest first, each with null bounds.
 */
export function getDailyTrafficFromReport(
	report: Report | undefined,
	startDate: string,
	endDate: string
): BenchmarkingDailyTrafficRow[] {
	const visitsByDate = new Map< string, number >();

	report?.rows?.forEach( ( row ) => {
		const date = parseDimensionStringToDate(
			row.dimensionValues?.[ 0 ]?.value ?? ''
		);

		if ( date instanceof Date ) {
			visitsByDate.set( getDateString( date ), getMetricValue( row ) );
		}
	} );

	const dailyTraffic: BenchmarkingDailyTrafficRow[] = [];

	// The date walks a day at a time, like the dates of the decoded
	// benchmarking response, so a daylight-saving change inside the range skips
	// no day.
	for (
		const date = stringToDate( startDate );
		getDateString( date ) <= endDate;
		date.setDate( date.getDate() + 1 )
	) {
		const dateString = getDateString( date );

		dailyTraffic.push( {
			date: dateString,
			visits: visitsByDate.get( dateString ) ?? 0,
			expectedMin: null,
			expectedMax: null,
		} );
	}

	return dailyTraffic;
}

/**
 * Gets the visits the Typical Traffic Overview panel draws in its chart and
 * shows as its total visits.
 *
 * The panel reads them from the benchmarking response, and each day of the
 * response carries its typical range, which the chart draws behind the line.
 * When the benchmarking request fails, the daily visits report gives the
 * visits of each day, with no typical range, and the visits over each range in
 * its totals, so the panel keeps its figures.
 *
 * @since n.e.x.t
 *
 * @param {Object}  options                        Options.
 * @param {Object}  [options.benchmarkingResponse] Optional. The benchmarking response, or `undefined` while there is none.
 * @param {boolean} options.benchmarkingFailed     Whether the request for the benchmarking response failed.
 * @param {Object}  [options.dailyVisitsReport]    Optional. The daily visits report, or `undefined` until it has arrived.
 * @param {string}  options.startDate              The first day of the selected range, as `YYYY-MM-DD`.
 * @param {string}  options.endDate                The last day of the selected range, as `YYYY-MM-DD`.
 * @return {Object} The visits on each day, and the visits over the selected range and the range before it, each `undefined` until its source has arrived.
 */
export function getTrafficOverviewVisits( {
	benchmarkingResponse,
	benchmarkingFailed,
	dailyVisitsReport,
	startDate,
	endDate,
}: TrafficOverviewVisitsOptions ): TrafficOverviewVisits {
	if ( benchmarkingFailed ) {
		// The report's totals hold the selected range first.
		return {
			dailyTraffic: getDailyTrafficFromReport(
				dailyVisitsReport,
				startDate,
				endDate
			),
			totalVisits: {
				current: getMetricValue( dailyVisitsReport?.totals?.[ 0 ] ),
				previous: getMetricValue( dailyVisitsReport?.totals?.[ 1 ] ),
			},
		};
	}

	return {
		dailyTraffic: benchmarkingResponse?.dailyTraffic,
		totalVisits: benchmarkingResponse?.visits,
	};
}

/**
 * Checks whether every day of the daily traffic has its typical range.
 *
 * The typical range covers every day of a date range or none of them, so the
 * chart draws its band, and the panel shows the analysis that compares the
 * visits with it, only when every day has one.
 *
 * @since n.e.x.t
 *
 * @param {Array} [dailyTraffic] Optional. The visits on each day of the date range, each with the bounds of the day's typical range, or null bounds on a day without one.
 * @return {boolean} True when there is a day and every day has both bounds, false otherwise.
 */
export function hasTypicalTrafficRange(
	dailyTraffic: BenchmarkingDailyTrafficRow[] = []
): boolean {
	return (
		dailyTraffic.length > 0 &&
		dailyTraffic.every(
			( { expectedMin, expectedMax } ) =>
				expectedMin !== null && expectedMax !== null
		)
	);
}

/**
 * Checks whether a notice says when to check back for a part of the typical
 * traffic view that waits for history, rather than asking for another date
 * range.
 *
 * A part shows from the last day of the first date range of this length with
 * enough history for it, its day. Only a range that ends on the last day a
 * range can end on gains it by waiting: no range that ends later can be
 * selected yet, so the notice says when to check back. A range that ends
 * earlier never gains the history it lacks, however long one waits, so the
 * notice asks for a range that ends on the part's day or after it, even a day
 * still ahead. A day that has passed always asks for another range, whatever
 * the selected range.
 *
 * @since n.e.x.t
 *
 * @param {string} availableFrom              The part's day, as `YYYY-MM-DD`.
 * @param {Object} dates                      The days the notice compares it with.
 * @param {string} dates.endDate              The last day of the selected date range, as `YYYY-MM-DD`.
 * @param {string} dates.latestSelectableDate The last day a date range can end on, as `YYYY-MM-DD`.
 * @return {boolean} True when the notice says when to check back, false when it asks for a range that ends later.
 */
function isCheckBackDay(
	availableFrom: string,
	{ endDate, latestSelectableDate }: TypicalTrafficNoticeDates
): boolean {
	return (
		endDate >= latestSelectableDate && availableFrom > latestSelectableDate
	);
}

/**
 * Gets the text of the notice that says when the chart will draw the typical
 * traffic range, while the site's history is too short for it.
 *
 * The range shows from the last day of the first date range of this length
 * with enough history, `availableFrom`. A selected range that ends on the last
 * day a range can end on reaches it by waiting, so the notice says when to
 * check back. One that ends earlier never does, so the notice asks for a range
 * that ends on that day or later, as `isCheckBackDay()` explains. Without the
 * day, the site has no recorded traffic up to the end of the selected range,
 * and the notice says only that its history is too short.
 *
 * @since n.e.x.t
 *
 * @param {string|null} availableFrom              The last day of the first date range of this length with the typical traffic range, as `YYYY-MM-DD`, or null when the site has no recorded traffic up to the end of the selected range.
 * @param {Object}      dates                      The days the notice compares it with.
 * @param {string}      dates.endDate              The last day of the selected date range, as `YYYY-MM-DD`.
 * @param {string}      dates.latestSelectableDate The last day a date range can end on, as `YYYY-MM-DD`.
 * @return {string} The notice's text.
 */
export function getTypicalTrafficRangeWaitingText(
	availableFrom: string | null,
	dates: TypicalTrafficNoticeDates
): string {
	if ( ! availableFrom ) {
		return __(
			'There isn’t enough traffic history for a typical traffic range on these dates.',
			'google-site-kit'
		);
	}

	const date = formatDate( availableFrom, { month: 'long' } );

	if ( isCheckBackDay( availableFrom, dates ) ) {
		return sprintf(
			/* translators: %s: the first day the typical traffic range shows, such as "April 2, 2025" */
			__(
				'We’re still learning what’s usual for your site. Check back on %s to see your typical traffic range.',
				'google-site-kit'
			),
			date
		);
	}

	return sprintf(
		/* translators: %s: the last day of the first date range of this length with a typical traffic range, such as "April 2, 2025" */
		__(
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after %s to see it.',
			'google-site-kit'
		),
		date
	);
}

/**
 * Gets the text of the notice that says when the key factors will show, while
 * the site's history doesn't cover the period before the selected date range,
 * which they compare it with.
 *
 * The key factors show from the last day of the first date range of this
 * length whose previous period has recorded traffic, `availableFrom`. A
 * selected range that ends on the last day a range can end on reaches it by
 * waiting, so the notice says when to check back. One that ends earlier never
 * does, so the notice asks for a range that ends on that day or later, as
 * `isCheckBackDay()` explains. Without the day, the site has no recorded
 * traffic up to the end of the selected range, and the notice says only that
 * there's nothing to compare to.
 *
 * @since n.e.x.t
 *
 * @param {string|null} availableFrom              The last day of the first date range of this length with the key factors, as `YYYY-MM-DD`, or null when the site has no recorded traffic up to the end of the selected range.
 * @param {Object}      dates                      The days the notice compares it with.
 * @param {string}      dates.endDate              The last day of the selected date range, as `YYYY-MM-DD`.
 * @param {string}      dates.latestSelectableDate The last day a date range can end on, as `YYYY-MM-DD`.
 * @return {string} The notice's text.
 */
export function getKeyFactorsWaitingText(
	availableFrom: string | null,
	dates: TypicalTrafficNoticeDates
): string {
	if ( ! availableFrom ) {
		return __(
			'There’s no previous period to compare to.',
			'google-site-kit'
		);
	}

	const date = formatDate( availableFrom, { month: 'long' } );

	if ( isCheckBackDay( availableFrom, dates ) ) {
		return sprintf(
			/* translators: %s: the first day the key factors show, such as "February 6, 2025" */
			__(
				'There’s no previous period to compare to yet. Check back on %s to see which channels changed the most.',
				'google-site-kit'
			),
			date
		);
	}

	return sprintf(
		/* translators: %s: the last day of the first date range of this length with the key factors, such as "February 6, 2025" */
		__(
			'There’s no previous period to compare to. Select a date range that ends on or after %s to see which channels changed the most.',
			'google-site-kit'
		),
		date
	);
}

/**
 * Gets the text of the notice that asks for a date range that ends later, to
 * see the typical traffic range and the key factors, while the selected range
 * has neither and ends before the last day a range can end on.
 *
 * Such a range never gains the history it lacks, so the notice asks for a
 * range that ends on each part's day or after it, the earlier first, or on
 * the day they share, whether the days have passed or not.
 *
 * @since n.e.x.t
 *
 * @param {string} bandAvailableFrom       The last day of the first date range of this length with the typical traffic range, as `YYYY-MM-DD`.
 * @param {string} keyFactorsAvailableFrom The last day of the first date range of this length with the key factors, as `YYYY-MM-DD`.
 * @return {string} The notice's text.
 */
function getTypicalTrafficSelectLaterText(
	bandAvailableFrom: string,
	keyFactorsAvailableFrom: string
): string {
	const keyFactorsFirst = keyFactorsAvailableFrom < bandAvailableFrom;
	const [ earlierDay, laterDay ] = keyFactorsFirst
		? [ keyFactorsAvailableFrom, bandAvailableFrom ]
		: [ bandAvailableFrom, keyFactorsAvailableFrom ];
	const laterDate = formatDate( laterDay, { month: 'long' } );

	if ( earlierDay === laterDay ) {
		return sprintf(
			/* translators: %s: the last day of the first date range of this length with both a typical traffic range and a previous period to compare to, such as "April 2, 2025" */
			__(
				'There isn’t enough traffic history for these dates. Select a date range that ends on or after %s to see your typical traffic range and which channels changed the most.',
				'google-site-kit'
			),
			laterDate
		);
	}

	const earlierDate = formatDate( earlierDay, { month: 'long' } );

	if ( keyFactorsFirst ) {
		return sprintf(
			/* translators: 1: the last day of the first date range of this length with a previous period to compare to, such as "February 6, 2025", 2: the last day of the first date range of this length with a typical traffic range, such as "April 2, 2025" */
			__(
				'There isn’t enough traffic history for these dates. Select a date range that ends on or after %1$s to see which channels changed the most, and on or after %2$s to see your typical traffic range.',
				'google-site-kit'
			),
			earlierDate,
			laterDate
		);
	}

	return sprintf(
		/* translators: 1: the last day of the first date range of this length with a typical traffic range, such as "April 2, 2025", 2: the last day of the first date range of this length with a previous period to compare to, such as "June 30, 2025" */
		__(
			'There isn’t enough traffic history for these dates. Select a date range that ends on or after %1$s to see your typical traffic range, and on or after %2$s to see which channels changed the most.',
			'google-site-kit'
		),
		earlierDate,
		laterDate
	);
}

/**
 * Gets the text of the notice that says when the typical traffic range and
 * the key factors will show, while the site's history is too short for both.
 *
 * Each part shows from the last day of the first date range of this length
 * with enough history for it, so one notice gives both days, the earlier
 * first, rather than two notices each giving its own:
 *
 * - When the selected range ends on the last day a range can end on, it gains
 *   each part by waiting, so the notice says when to check back for each, or
 *   for both on a day they share.
 * - When it ends earlier, it never gains them, so the notice asks for a range
 *   that ends on each day or after it, whether the days have passed or not,
 *   as `isCheckBackDay()` explains.
 * - Without the days, the site has no recorded traffic up to the end of the
 *   selected range, so the notice says only that its history is too short
 *   for either part.
 *
 * @since n.e.x.t
 *
 * @param {string|null} bandAvailableFrom          The last day of the first date range of this length with the typical traffic range, as `YYYY-MM-DD`, or null when the site has no recorded traffic up to the end of the selected range.
 * @param {string|null} keyFactorsAvailableFrom    The last day of the first date range of this length with the key factors, as `YYYY-MM-DD`, or null when the site has no recorded traffic up to the end of the selected range.
 * @param {Object}      dates                      The days the notice compares them with.
 * @param {string}      dates.endDate              The last day of the selected date range, as `YYYY-MM-DD`.
 * @param {string}      dates.latestSelectableDate The last day a date range can end on, as `YYYY-MM-DD`.
 * @return {string} The notice's text.
 */
export function getTypicalTrafficWaitingText(
	bandAvailableFrom: string | null,
	keyFactorsAvailableFrom: string | null,
	dates: TypicalTrafficNoticeDates
): string {
	// Both days are counted from the site's first day of recorded traffic, so
	// the response has both or neither.
	if ( ! bandAvailableFrom || ! keyFactorsAvailableFrom ) {
		return __(
			'There isn’t enough traffic history for a typical traffic range on these dates, and there’s no previous period to compare to.',
			'google-site-kit'
		);
	}

	const keyFactorsFirst = keyFactorsAvailableFrom < bandAvailableFrom;
	const [ earlierDay, laterDay ] = keyFactorsFirst
		? [ keyFactorsAvailableFrom, bandAvailableFrom ]
		: [ bandAvailableFrom, keyFactorsAvailableFrom ];

	// The later day is ahead whenever the earlier is.
	if ( ! isCheckBackDay( earlierDay, dates ) ) {
		return getTypicalTrafficSelectLaterText(
			bandAvailableFrom,
			keyFactorsAvailableFrom
		);
	}

	const earlierDate = formatDate( earlierDay, { month: 'long' } );

	if ( earlierDay === laterDay ) {
		return sprintf(
			/* translators: %s: the first day both the typical traffic range and the key factors show, such as "April 2, 2025" */
			__(
				'We’re still learning what’s usual for your site. Check back on %s to see your typical traffic range and which channels changed the most.',
				'google-site-kit'
			),
			earlierDate
		);
	}

	const laterDate = formatDate( laterDay, { month: 'long' } );

	if ( keyFactorsFirst ) {
		return sprintf(
			/* translators: 1: the first day the key factors show, such as "February 6, 2025", 2: the first day the typical traffic range shows, such as "April 2, 2025" */
			__(
				'We’re still learning what’s usual for your site. Check back on %1$s to see which channels changed the most, and on %2$s to see your typical traffic range.',
				'google-site-kit'
			),
			earlierDate,
			laterDate
		);
	}

	return sprintf(
		/* translators: 1: the first day the typical traffic range shows, such as "April 2, 2025", 2: the first day the key factors show, such as "June 30, 2025" */
		__(
			'We’re still learning what’s usual for your site. Check back on %1$s to see your typical traffic range, and on %2$s to see which channels changed the most.',
			'google-site-kit'
		),
		earlierDate,
		laterDate
	);
}

/**
 * Gets the text of the notice at the top of the Typical Traffic Overview
 * panel, which says what the selected date range lacks, if anything.
 *
 * The panel says it once, in the analysis's place, rather than in a notice for
 * each part. The first that holds gives the text:
 *
 * 1. A range too short for the key factors asks for one of at least 7 days.
 *    Its typical traffic range, if it waits too, waits for a day that a
 *    longer range moves, so the notice says nothing of it.
 * 2. While the key factors wait for the period before the range, the notice
 *    says when they will show, and when the typical traffic range will, if it
 *    waits too.
 * 3. While the typical traffic range alone waits, the notice says when it
 *    will show.
 *
 *    A waiting part's notice says when to check back only for a range that
 *    ends on the last day a range can end on. A range that ends earlier never
 *    gains the history it lacks, so the notice asks for a range that ends on
 *    the part's day or after it.
 * 4. A range too long for the generated insight, with the `trafficInsights`
 *    feature, says what range the insight needs. A range whose key factors
 *    wait has no insight either way, and says what they wait for instead.
 *
 * The key factors' section shows only for a range with key factors, so it
 * never says what a range lacks. The dashboard's panel and the PDF export
 * show the same notice.
 *
 * @since n.e.x.t
 *
 * @param {Object}      availability                         Which parts of the typical traffic view the selected date range has.
 * @param {boolean}     availability.rangeTooShort           Whether the range is too short for the key factors.
 * @param {boolean}     availability.bandAvailable           Whether every day of the range has its typical traffic range.
 * @param {string|null} availability.bandAvailableFrom       The last day of the first date range of this length with the typical traffic range, or null.
 * @param {boolean}     availability.keyFactorsAvailable     Whether the range has the key factors.
 * @param {string|null} availability.keyFactorsAvailableFrom The last day of the first date range of this length with the key factors, or null.
 * @param {boolean}     availability.rangeTooLong            Whether the range is too long for the generated insight.
 * @param {Object}      options                              Options.
 * @param {string}      options.endDate                      The last day of the selected date range, as `YYYY-MM-DD`.
 * @param {string}      options.latestSelectableDate         The last day a date range can end on, as `YYYY-MM-DD`: today on the dashboard, and the day before in the PDF export.
 * @param {boolean}     options.insightsEnabled              Whether the panel shows the generated insights, with the `trafficInsights` feature.
 * @return {string|null} The notice's text, or null when the range lacks nothing.
 */
export function getTypicalTrafficAvailabilityText(
	{
		rangeTooShort,
		bandAvailable,
		bandAvailableFrom,
		keyFactorsAvailable,
		keyFactorsAvailableFrom,
		rangeTooLong,
	}: Pick<
		TypicalTrafficAvailability,
		| 'rangeTooShort'
		| 'bandAvailable'
		| 'bandAvailableFrom'
		| 'keyFactorsAvailable'
		| 'keyFactorsAvailableFrom'
		| 'rangeTooLong'
	>,
	{
		insightsEnabled,
		...dates
	}: TypicalTrafficNoticeDates & { insightsEnabled: boolean }
): string | null {
	if ( rangeTooShort ) {
		return __(
			'Select a date range of at least 7 days to see which channels changed the most.',
			'google-site-kit'
		);
	}

	if ( ! keyFactorsAvailable ) {
		return bandAvailable
			? getKeyFactorsWaitingText( keyFactorsAvailableFrom, dates )
			: getTypicalTrafficWaitingText(
					bandAvailableFrom,
					keyFactorsAvailableFrom,
					dates
			  );
	}

	if ( ! bandAvailable ) {
		return getTypicalTrafficRangeWaitingText( bandAvailableFrom, dates );
	}

	if ( rangeTooLong && insightsEnabled ) {
		return __(
			'Select a date range of up to 364 days to see insights about your traffic.',
			'google-site-kit'
		);
	}

	return null;
}
