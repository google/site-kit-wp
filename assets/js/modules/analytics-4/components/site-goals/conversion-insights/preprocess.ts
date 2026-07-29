/**
 * Conversion Insights client-side preprocessing.
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
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import { buildConversionInsightEvent } from './buildConversionInsightEvents';
import { ConversionInsightEventData } from './types';

/**
 * A single reporting window (inclusive) as `YYYY-MM-DD` strings.
 */
export interface ConversionInsightWindow {
	startDate: string;
	endDate: string;
}

/**
 * The four calendar windows the Conversion Insights request compares.
 */
export interface ConversionInsightDateRanges {
	current: ConversionInsightWindow;
	previous: ConversionInsightWindow;
	yoyCurrent: ConversionInsightWindow;
	yoyPrevious: ConversionInsightWindow;
	monthStartDate: string;
}

/**
 * The three GA4 report option sets the preprocessing needs.
 */
export interface ConversionInsightReportOptions {
	siteWideOptions: Record< string, unknown >;
	eventOptions: Record< string, unknown >;
	yoyOptions: Record< string, unknown >;
}

const CURRENT_RANGE_SLUG = 'date_range_0';
const PREVIOUS_RANGE_SLUG = 'date_range_1';

function pad( value: number ): string {
	return String( value ).padStart( 2, '0' );
}

function utcDateString(
	year: number,
	monthIndex: number,
	day: number
): string {
	// Builds a specific calendar boundary from parts derived from the caller's
	// referenceDate — never the current time — so the reference-date selector
	// does not apply here; UTC keeps the math timezone-independent.
	// eslint-disable-next-line sitekit/no-direct-date
	const date = new Date( Date.UTC( year, monthIndex, day ) );
	return `${ date.getUTCFullYear() }-${ pad(
		date.getUTCMonth() + 1
	) }-${ pad( date.getUTCDate() ) }`;
}

/**
 * Derives the four calendar windows from a reference date (the site's "today").
 *
 * The contract is calendar-month based: the current window is month-to-date, the
 * previous window is the full preceding calendar month, and each YoY window is the
 * equivalent one calendar year earlier. `monthStartDate` names the current month.
 *
 * @since n.e.x.t
 *
 * @param {string} referenceDate The site's reference date as `YYYY-MM-DD`.
 * @return {Object} The four windows plus `monthStartDate`.
 */
export function getConversionInsightDateRanges(
	referenceDate: string
): ConversionInsightDateRanges {
	const [ year, month, day ] = referenceDate.split( '-' ).map( Number );
	// `month` is 1-based from the string; `monthIndex` is the 0-based Date form.
	const monthIndex = month - 1;

	// Current: first of this month → the reference date (month-to-date).
	const current = {
		startDate: `${ year }-${ pad( month ) }-01`,
		endDate: referenceDate,
	};

	// Previous: the full preceding calendar month. Day `0` of a month is the last
	// day of the prior month, and handles year rollover.
	const previous = {
		startDate: utcDateString( year, monthIndex - 1, 1 ),
		endDate: utcDateString( year, monthIndex, 0 ),
	};

	// YoY current: the same month-to-date window one calendar year earlier.
	const yoyCurrent = {
		startDate: utcDateString( year - 1, monthIndex, 1 ),
		endDate: utcDateString( year - 1, monthIndex, day ),
	};

	// YoY previous: the full preceding month one calendar year earlier.
	const yoyPrevious = {
		startDate: utcDateString( year - 1, monthIndex - 1, 1 ),
		endDate: utcDateString( year - 1, monthIndex, 0 ),
	};

	return {
		current,
		previous,
		yoyCurrent,
		yoyPrevious,
		monthStartDate: `${ year }-${ pad( month ) }-01`,
	};
}

/**
 * Builds the GA4 report option sets for the Conversion Insights request.
 *
 * Mirrors source-data §1.1: a site-wide volume/engagement report and a per-event
 * report (current + previous), plus a separate per-event YoY report. Each is a
 * standard cacheable `getReport` request, so repeat page loads reuse the client cache.
 *
 * @since n.e.x.t
 *
 * @param {Object}   dateRanges    Windows from `getConversionInsightDateRanges`.
 * @param {string[]} keyEventNames The GA4 key event names to analyze.
 * @return {Object} `{ siteWideOptions, eventOptions, yoyOptions }`.
 */
export function buildConversionInsightReportOptions(
	dateRanges: ConversionInsightDateRanges,
	keyEventNames: string[]
): ConversionInsightReportOptions {
	const eventNameFilter = {
		eventName: {
			filterType: 'inListFilter',
			value: keyEventNames,
		},
	};

	const siteWideOptions = {
		startDate: dateRanges.current.startDate,
		endDate: dateRanges.current.endDate,
		compareStartDate: dateRanges.previous.startDate,
		compareEndDate: dateRanges.previous.endDate,
		// engagementRate is index 0, sessions is index 1.
		metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
		reportID:
			'analytics-4_conversion-insights_site-wide_store:selector_options',
	};

	const eventOptions = {
		startDate: dateRanges.current.startDate,
		endDate: dateRanges.current.endDate,
		compareStartDate: dateRanges.previous.startDate,
		compareEndDate: dateRanges.previous.endDate,
		dimensions: [ { name: 'eventName' } ],
		// eventCount is index 0, event-scoped sessions is index 1 (used only for
		// the conversion rate; not sent as the payload's site-wide sessions).
		metrics: [ { name: 'eventCount' }, { name: 'sessions' } ],
		dimensionFilters: eventNameFilter,
		reportID:
			'analytics-4_conversion-insights_by-event_store:selector_options',
	};

	const yoyOptions = {
		startDate: dateRanges.yoyCurrent.startDate,
		endDate: dateRanges.yoyCurrent.endDate,
		compareStartDate: dateRanges.yoyPrevious.startDate,
		compareEndDate: dateRanges.yoyPrevious.endDate,
		dimensions: [ { name: 'eventName' } ],
		metrics: [ { name: 'eventCount' } ],
		dimensionFilters: eventNameFilter,
		reportID:
			'analytics-4_conversion-insights_by-event-yoy_store:selector_options',
	};

	return { siteWideOptions, eventOptions, yoyOptions };
}

function toInt( value: string | undefined ): number {
	return parseInt( value ?? '', 10 ) || 0;
}

function toFloat( value: string | undefined ): number {
	return parseFloat( value ?? '' ) || 0;
}

interface SiteWidePeriod {
	sessions: number;
	engagementRate: number;
}

// Reads site-wide sessions and engagement rate per period from the totals rows.
function extractSiteWide( report: Report | undefined ): {
	current: SiteWidePeriod;
	previous: SiteWidePeriod;
} {
	const totals = ( report?.totals ?? [] ) as ReportRow[];

	function read( slug: string ) {
		const row = totals.find(
			( entry ) => entry?.dimensionValues?.[ 0 ]?.value === slug
		);
		return {
			engagementRate: toFloat( row?.metricValues?.[ 0 ]?.value ),
			sessions: toInt( row?.metricValues?.[ 1 ]?.value ),
		};
	}

	return {
		current: read( CURRENT_RANGE_SLUG ),
		previous: read( PREVIOUS_RANGE_SLUG ),
	};
}

interface EventPeriod {
	eventCount: number;
	sessions: number;
}

// Reads per-event eventCount and event-scoped sessions per period, defaulting any
// (event × range) tuple absent from the response to zero (source-data reconstruction).
function extractByEvent(
	report: Report | undefined,
	keyEventNames: string[]
): Record< string, { current: EventPeriod; previous: EventPeriod } > {
	const rows = ( report?.rows ?? [] ) as ReportRow[];

	function read( eventName: string, slug: string ) {
		const row = rows.find(
			( entry ) =>
				entry?.dimensionValues?.[ 0 ]?.value === eventName &&
				entry?.dimensionValues?.[ 1 ]?.value === slug
		);
		return {
			eventCount: toInt( row?.metricValues?.[ 0 ]?.value ),
			sessions: toInt( row?.metricValues?.[ 1 ]?.value ),
		};
	}

	return keyEventNames.reduce( ( acc, eventName ) => {
		acc[ eventName ] = {
			current: read( eventName, CURRENT_RANGE_SLUG ),
			previous: read( eventName, PREVIOUS_RANGE_SLUG ),
		};
		return acc;
	}, {} as Record< string, { current: EventPeriod; previous: EventPeriod } > );
}

// Reads per-event YoY conversion counts (eventCount only), zero-backfilled.
function extractYoY(
	report: Report | undefined,
	keyEventNames: string[]
): Record< string, { current: number; previous: number } > {
	const rows = ( report?.rows ?? [] ) as ReportRow[];

	function read( eventName: string, slug: string ) {
		const row = rows.find(
			( entry ) =>
				entry?.dimensionValues?.[ 0 ]?.value === eventName &&
				entry?.dimensionValues?.[ 1 ]?.value === slug
		);
		return toInt( row?.metricValues?.[ 0 ]?.value );
	}

	return keyEventNames.reduce( ( acc, eventName ) => {
		acc[ eventName ] = {
			current: read( eventName, CURRENT_RANGE_SLUG ),
			previous: read( eventName, PREVIOUS_RANGE_SLUG ),
		};
		return acc;
	}, {} as Record< string, { current: number; previous: number } > );
}

function rate( eventSessions: number, siteSessions: number ): number {
	// Guard divide-by-zero (source-data §1.3): emit 0 when site sessions are 0.
	return siteSessions === 0 ? 0 : eventSessions / siteSessions;
}

/**
 * Assembles the Conversion Insights request payload from the fetched reports.
 *
 * Shared by the `useConversionInsightEvents` hook and by tests/stories, so the
 * payload (and therefore the datastore cache key) is identical in every context.
 * Returns `null` while the required reports are still loading.
 *
 * @since n.e.x.t
 *
 * @param {string}   referenceDate          The site's reference date as `YYYY-MM-DD`.
 * @param {string[]} keyEventNames          The GA4 key event names to analyze.
 * @param {Object}   reports                The fetched reports.
 * @param {Object}   reports.siteWideReport The site-wide volume/engagement report.
 * @param {Object}   reports.eventReport    The per-event current/previous report.
 * @param {Object}   [reports.yoyReport]    The per-event YoY report (optional).
 * @return {Object[]|null} The `events` payload, or `null` if not ready.
 */
export function assembleConversionInsightEvents(
	referenceDate: string,
	keyEventNames: string[],
	reports: {
		siteWideReport?: Report;
		eventReport?: Report;
		yoyReport?: Report;
	}
): ConversionInsightEventData[] | null {
	const { siteWideReport, eventReport, yoyReport } = reports;

	if (
		! referenceDate ||
		! keyEventNames.length ||
		! siteWideReport ||
		! eventReport
	) {
		return null;
	}

	const dateRanges = getConversionInsightDateRanges( referenceDate );
	const siteWide = extractSiteWide( siteWideReport );
	const byEvent = extractByEvent( eventReport, keyEventNames );
	const yoy = yoyReport ? extractYoY( yoyReport, keyEventNames ) : undefined;

	return keyEventNames.map( ( keyEventName ) => {
		const event = byEvent[ keyEventName ];

		return buildConversionInsightEvent( {
			keyEventName,
			monthStartDate: dateRanges.monthStartDate,
			current: {
				conversions: event.current.eventCount,
				conversionRate: rate(
					event.current.sessions,
					siteWide.current.sessions
				),
				sessions: siteWide.current.sessions,
				engagementRate: siteWide.current.engagementRate,
			},
			previous: {
				conversions: event.previous.eventCount,
				conversionRate: rate(
					event.previous.sessions,
					siteWide.previous.sessions
				),
				sessions: siteWide.previous.sessions,
				engagementRate: siteWide.previous.engagementRate,
			},
			yoy: yoy
				? {
						current: yoy[ keyEventName ].current,
						previous: yoy[ keyEventName ].previous,
				  }
				: undefined,
		} );
	} );
}
