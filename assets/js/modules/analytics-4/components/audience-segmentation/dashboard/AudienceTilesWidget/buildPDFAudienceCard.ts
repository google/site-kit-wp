/**
 * Audience card builder for the Your visitor groups PDF widget.
 *
 * Turns one audience's raw report results into the card data the PDF renders.
 * The loader in `getPDFData.ts` resolves and fetches the reports, then calls
 * `buildPDFAudienceCard` for each audience.
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
import { isInvalidCustomDimensionError } from '@/js/modules/analytics-4/utils/custom-dimensions';
import { reportRowsWithSetValues } from '@/js/modules/analytics-4/utils/report-rows-with-set-values';

/** The top content list shows at most three pages. */
const MAX_TOP_CONTENT_PAGES = 3;

/** A metric's value for the current period, and for the comparison period. */
export interface AudienceTileMetric {
	/** The metric value for the current period. */
	current: number;
	/** The metric value for the comparison period, used for the change chip. */
	previous: number;
}

/** The pageviews metric, plus its share of the site's total pageviews. */
export interface AudienceTilePageviewsMetric extends AudienceTileMetric {
	/** The audience's pageviews as a fraction of the site's total pageviews, from 0 to 1. */
	percentageOfTotalPageViews: number;
}

/** One row of the top cities list. */
export interface AudienceTileTopCity {
	/** The city name. */
	name: string;
	/** The city's share of the audience's visitors, as a fraction from 0 to 1. */
	percentage: number;
}

/** One row of the top content list. */
export interface AudienceTileTopContent {
	/** The page title, or the page path when no title resolved. */
	title: string;
	/** The page's pageviews. */
	pageviews: number;
	/** Analytics report link for the page, which the title links to, when the page has one. */
	serviceURL?: string;
}

/** One audience card's fully loaded data. */
export interface AudienceTilePDFData {
	/** The audience resource name, like `properties/123/audiences/456`. */
	audienceResourceName: string;
	/** The audience display name shown in the card header. */
	audienceName: string;
	/** The four period-over-period metrics. */
	metrics: {
		visitors: AudienceTileMetric;
		visitsPerVisitor: AudienceTileMetric;
		pagesPerVisit: AudienceTileMetric;
		pageviews: AudienceTilePageviewsMetric;
	};
	/** Up to three top cities. */
	topCities: AudienceTileTopCity[];
	/** Up to three top content pages. */
	topContent: AudienceTileTopContent[];
}

/** The result of one `fetchGetReport` dispatch. */
export interface FetchReportResult {
	/** The report, or `undefined` when the fetch failed or was skipped. */
	response?: Report;
	/** The fetch error, or `undefined` on success or when skipped. */
	error?: unknown;
}

/** The audience type, as returned by the Analytics 4 store. */
export type AudienceType =
	| 'DEFAULT_AUDIENCE'
	| 'SITE_KIT_AUDIENCE'
	| 'USER_AUDIENCE';

/** An available audience, as returned by `getOrSyncAvailableAudiences`. */
export interface AvailableAudience {
	/** The audience resource name, like `properties/123/audiences/456`. */
	name: string;
	/** The audience display name shown in the card header. */
	displayName?: string;
	/** The audience type, `SITE_KIT_AUDIENCE` for a Site Kit audience. */
	audienceType?: AudienceType;
	/** The Site Kit audience slug, like `new-visitors`, on a Site Kit audience. */
	audienceSlug?: string;
}

/**
 * Reads one audience's four metric values for a date range.
 *
 * Finds the row for the audience and date range, then reads the four metrics in
 * order, like the dashboard's `Body.js`. A missing value reads as `0`.
 *
 * @since n.e.x.t
 *
 * @param report         The metrics report, or `undefined`.
 * @param dimensionValue The audience's first-dimension value.
 * @param dateRange      Either `date_range_0` (current) or `date_range_1` (previous).
 * @return The four metric values: total users, sessions per user, pageviews per session, and pageviews.
 */
function readMetricRow(
	report: Report | undefined,
	dimensionValue: string,
	dateRange: string
): number[] {
	const row = report?.rows?.find(
		( { dimensionValues }: ReportRow ) =>
			dimensionValues?.[ 0 ]?.value === dimensionValue &&
			dimensionValues?.[ 1 ]?.value === dateRange
	);

	return [ 0, 1, 2, 3 ].map( ( index ) =>
		Number( row?.metricValues?.[ index ]?.value || 0 )
	);
}

/**
 * Reads one audience's four metrics, each with a current and previous value.
 *
 * @since n.e.x.t
 *
 * @param report         The metrics report, or `undefined`.
 * @param dimensionValue The audience's first-dimension value.
 * @return The four metrics, each with its current and previous value.
 */
export function readAudienceMetrics(
	report: Report | undefined,
	dimensionValue: string
): AudienceTilePDFData[ 'metrics' ] {
	const current = readMetricRow( report, dimensionValue, 'date_range_0' );
	const previous = readMetricRow( report, dimensionValue, 'date_range_1' );

	return {
		visitors: { current: current[ 0 ], previous: previous[ 0 ] },
		visitsPerVisitor: { current: current[ 1 ], previous: previous[ 1 ] },
		pagesPerVisit: { current: current[ 2 ], previous: previous[ 2 ] },
		pageviews: {
			current: current[ 3 ],
			previous: previous[ 3 ],
			percentageOfTotalPageViews: 0,
		},
	};
}

/**
 * Builds an audience's top three cities, removing `(not set)`.
 *
 * Each percentage is the city's share of the audience's visitors, like the
 * dashboard.
 *
 * @since n.e.x.t
 *
 * @param report   The top cities report, or `undefined`.
 * @param visitors The audience's current-period total visitors, the percentage denominator.
 * @return Up to three top cities.
 */
export function buildTopCities(
	report: Report | undefined,
	visitors: number
): AudienceTileTopCity[] {
	const rows = report?.rows ? reportRowsWithSetValues( report.rows ) : [];

	return rows.map( ( row: ReportRow ) => {
		const users = Number( row.metricValues?.[ 0 ]?.value || 0 );

		return {
			name: row.dimensionValues?.[ 0 ]?.value || '',
			percentage: visitors > 0 ? users / visitors : 0,
		};
	} );
}

/**
 * Builds an audience's top content, resolving each page path to its page title
 * and to its Analytics report link.
 *
 * @since n.e.x.t
 *
 * @param report               The top content report, or `undefined`.
 * @param titlesReport         The page titles report used to resolve a path to its title, or `undefined`.
 * @param getContentServiceURL Maps a page path to its Analytics report link, or to an empty string when the page has no link.
 * @return Up to three top content pages.
 */
export function buildTopContent(
	report: Report | undefined,
	titlesReport: Report | undefined,
	getContentServiceURL: ( pagePath: string ) => string
): AudienceTileTopContent[] {
	const titlesByPath = ( titlesReport?.rows || [] ).reduce(
		( titles: Record< string, string >, row: ReportRow ) => {
			const pagePath = row.dimensionValues?.[ 0 ]?.value;
			const pageTitle = row.dimensionValues?.[ 1 ]?.value;

			if ( pagePath ) {
				titles[ pagePath ] = pageTitle || '';
			}

			return titles;
		},
		{}
	);

	return ( report?.rows || [] )
		.slice( 0, MAX_TOP_CONTENT_PAGES )
		.map( ( row: ReportRow ) => {
			const pagePath = row.dimensionValues?.[ 0 ]?.value || '';

			return {
				title: titlesByPath[ pagePath ] || pagePath,
				pageviews: Number( row.metricValues?.[ 0 ]?.value || 0 ),
				serviceURL: getContentServiceURL( pagePath ),
			};
		} );
}

/**
 * Returns `new` or `returning` for a Site Kit audience slug.
 *
 * @since n.e.x.t
 *
 * @param audienceSlug The Site Kit audience slug, like `new-visitors`.
 * @return `new` for the new visitors audience, otherwise `returning`.
 */
export function siteKitAudienceDimensionValue(
	audienceSlug: string | undefined
): string {
	return audienceSlug === 'new-visitors' ? 'new' : 'returning';
}

/** The reports and context for one audience card. */
export interface AudienceCardInput {
	/** The audience resource name. */
	audienceResourceName: string;
	/** The audience from `getOrSyncAvailableAudiences`, or `undefined`. */
	audience: AvailableAudience | undefined;
	/** Whether this audience reads metrics from the Site Kit fallback report. */
	usesSiteKitReport: boolean;
	/** The metrics report result this audience reads from. */
	metricsResult: FetchReportResult;
	/** The audience's top cities report result. */
	topCitiesResult: FetchReportResult;
	/** The audience's top content report result. */
	topContentResult: FetchReportResult;
	/** The audience's top content page titles report result. */
	topContentPageTitlesResult: FetchReportResult;
	/** The site's total pageviews, the percentage denominator. */
	totalPageviews: number;
	/** Maps a top content page path to its Analytics report link, or to an empty string when the page has no link. */
	getContentServiceURL: ( pagePath: string ) => string;
}

/**
 * Builds one audience card, or returns `null` to drop the audience when its
 * reports fail.
 *
 * @since n.e.x.t
 *
 * @param input The reports and context for the audience.
 * @return The audience card, or `null` when the audience is excluded.
 */
export function buildPDFAudienceCard(
	input: AudienceCardInput
): AudienceTilePDFData | null {
	const {
		audienceResourceName,
		audience,
		usesSiteKitReport,
		metricsResult,
		topCitiesResult,
		topContentResult,
		topContentPageTitlesResult,
		totalPageviews,
		getContentServiceURL,
	} = input;

	// Don't render when a metrics or cities report has any error, or when
	// a top content failure is anything other than a missing/invalid custom
	// dimension error.
	if (
		metricsResult.error ||
		topCitiesResult.error ||
		( topContentResult.error &&
			! isInvalidCustomDimensionError( topContentResult.error ) ) ||
		( topContentPageTitlesResult.error &&
			! isInvalidCustomDimensionError(
				topContentPageTitlesResult.error
			) )
	) {
		return null;
	}

	const dimensionValue = usesSiteKitReport
		? siteKitAudienceDimensionValue( audience?.audienceSlug )
		: audienceResourceName;

	const metrics = readAudienceMetrics(
		metricsResult.response,
		dimensionValue
	);

	metrics.pageviews.percentageOfTotalPageViews =
		totalPageviews !== 0 ? metrics.pageviews.current / totalPageviews : 0;

	return {
		audienceResourceName,
		audienceName: audience?.displayName || '',
		metrics,
		topCities: buildTopCities(
			topCitiesResult.response,
			metrics.visitors.current
		),
		topContent: buildTopContent(
			topContentResult.response,
			topContentPageTitlesResult.response,
			getContentServiceURL
		),
	};
}
