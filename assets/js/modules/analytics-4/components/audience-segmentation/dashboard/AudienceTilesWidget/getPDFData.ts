/**
 * PDF data loader for the Your visitor groups widget.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	MODULES_ANALYTICS_4,
	RESOURCE_TYPE_AUDIENCE,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
	ReportRow,
} from '@/js/modules/analytics-4/datastore/types';
import {
	getAudienceTilesMetricsReportOptions,
	getAudienceTilesSiteKitAudiencesReportOptions,
	getAudienceTilesTopCitiesReportOptions,
	getAudienceTilesTopContentPageTitlesReportOptions,
	getAudienceTilesTopContentReportOptions,
	getAudienceTilesTotalPageviewsReportOptions,
} from '@/js/modules/analytics-4/utils/audienceTilesReportOptions';
import { isInvalidCustomDimensionError } from '@/js/modules/analytics-4/utils/custom-dimensions';
import { reportRowsWithSetValues } from '@/js/modules/analytics-4/utils/report-rows-with-set-values';

/** The section needs at least two cards, so a single-card row never appears. */
const MIN_AUDIENCE_TILES = 2;
/** The row shows at most three cards, the first three configured audiences. */
const MAX_AUDIENCE_TILES = 3;
/** Each audience fetches its own cities, content, and content page titles reports. */
const REPORTS_PER_AUDIENCE = 3;
/** The top cities and top content lists each show at most three rows. */
const TOP_LIST_LIMIT = 3;

/** One period's value for a metric, and the same metric for the comparison period. */
export interface AudienceTileMetric {
	/** The metric value for the current period. */
	current: number;
	/** The metric value for the comparison period, used for the delta chip. */
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
}

/** One audience card's fully-loaded data. */
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

/** The loaded audience cards, or `null` when the section is omitted. */
export interface AudienceTilesPDFData {
	data: {
		/** The successfully-loaded audience cards, two or three of them. */
		audiences: AudienceTilePDFData[];
	} | null;
}

/** The result of one `fetchGetReport` dispatch. */
interface FetchReportResult {
	/** The report, or `undefined` when the fetch failed or was skipped. */
	response?: Report;
	/** The fetch error, or `undefined` on success or when skipped. */
	error?: unknown;
}

interface GetPDFDataParams {
	/** WordPress data registry. */
	registry: {
		/** Returns the given store's action creators. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry actions are loosely typed in this codebase.
		dispatch: ( storeName: string ) => any;
		/** Returns the given store's selectors, where each selector resolves once its data has loaded. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry selectors are loosely typed in this codebase.
		resolveSelect: ( storeName: string ) => any;
		/** Returns the given store's selectors. */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry selectors are loosely typed in this codebase.
		select: ( storeName: string ) => any;
	};
	/** Report date range, with the current day already excluded. */
	dates: Pick<
		ReportOptions,
		'startDate' | 'endDate' | 'compareStartDate' | 'compareEndDate'
	>;
	/** Signal that cancels the export. */
	signal: AbortSignal;
}

/** An available audience, as returned by `getOrSyncAvailableAudiences`. */
interface AvailableAudience {
	/** The audience resource name, like `properties/123/audiences/456`. */
	name: string;
	/** The audience display name shown in the card header. */
	displayName?: string;
	/** The audience type, `SITE_KIT_AUDIENCE` for a Site Kit audience. */
	audienceType?: string;
	/** The Site Kit audience slug, like `new-visitors`, on a Site Kit audience. */
	audienceSlug?: string;
}

/**
 * Reads one audience's four metric values for a date range.
 *
 * It finds the row for the audience and date range, then reads the four
 * metrics in order, like the dashboard's `Body.js`. A missing value reads as
 * `0`.
 *
 * @since n.e.x.t
 *
 * @param report         The metrics report, or `undefined`.
 * @param dimensionValue The audience's first-dimension value.
 * @param dateRange      Either `date_range_0` (current) or `date_range_1` (previous).
 * @return The four metric values: total users, sessions per user, pageviews per session, pageviews.
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
function readAudienceMetrics(
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
 * Builds an audience's top three cities, dropping `(not set)`.
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
function buildTopCities(
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
 * Builds an audience's top content, resolving each page path to its page title.
 *
 * @since n.e.x.t
 *
 * @param report       The top content report, or `undefined`.
 * @param titlesReport The page titles report used to resolve a path to its title, or `undefined`.
 * @return Up to three top content pages.
 */
function buildTopContent(
	report: Report | undefined,
	titlesReport: Report | undefined
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
		.slice( 0, TOP_LIST_LIMIT )
		.map( ( row: ReportRow ) => {
			const pagePath = row.dimensionValues?.[ 0 ]?.value || '';

			return {
				title: titlesByPath[ pagePath ] || pagePath,
				pageviews: Number( row.metricValues?.[ 0 ]?.value || 0 ),
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
function siteKitAudienceDimensionValue(
	audienceSlug: string | undefined
): string {
	return audienceSlug === 'new-visitors' ? 'new' : 'returning';
}

/**
 * Decides whether a report failure should drop its audience.
 *
 * A missing custom dimension on the top content report is not blocking,
 * matching the dashboard: the card still renders with an empty content list.
 *
 * @since n.e.x.t
 *
 * @param result The report fetch result.
 * @return `true` when the failure should exclude the audience.
 */
function isBlockingError( result: FetchReportResult ): boolean {
	return !! result.error && ! isInvalidCustomDimensionError( result.error );
}

/** The reports and context one audience card is built from. */
interface AudienceCardInput {
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
}

/**
 * Builds one audience card, or returns `null` to drop the audience when its
 * reports failed.
 *
 * @since n.e.x.t
 *
 * @param input The reports and context for the audience.
 * @return The audience card, or `null` when the audience is excluded.
 */
function buildAudienceCard(
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
	} = input;

	// Drop the audience on a failed metrics or cities report, or a top content
	// failure that is not a missing custom dimension.
	if (
		metricsResult.error ||
		topCitiesResult.error ||
		isBlockingError( topContentResult ) ||
		isBlockingError( topContentPageTitlesResult )
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
			topContentPageTitlesResult.response
		),
	};
}

/** The context needed to fetch every audience report. */
interface FetchAudienceReportsInput {
	/** WordPress data registry. */
	registry: GetPDFDataParams[ 'registry' ];
	/** Report date range, with the current day excluded. */
	dates: GetPDFDataParams[ 'dates' ];
	/** The first three configured audiences, in configured order. */
	audienceResourceNames: string[];
	/** The Site Kit audiences among them. */
	siteKitAudiences: AvailableAudience[];
	/** Whether any Site Kit audience is in a partial data state, or `undefined` while loading. */
	isSiteKitAudiencePartialData: boolean | undefined;
	/** Signal that cancels the export. */
	signal: AbortSignal;
}

/** Every audience report result, in one object. */
interface AudienceReports {
	/** The main per-audience metrics report result. */
	mainResult: FetchReportResult;
	/** The Site Kit `newVsReturning` fallback report result. */
	siteKitResult: FetchReportResult;
	/** The site-wide total pageviews report result. */
	totalPageviewsResult: FetchReportResult;
	/** The per-audience cities, content, and content title report results, three per audience in order. */
	cardResults: FetchReportResult[];
}

/**
 * Fetches every report the audience cards need in parallel, each with the
 * abort signal.
 *
 * It mirrors the dashboard's branching: the main per-audience report, the
 * `newVsReturning` fallback for gathering-data Site Kit audiences, and a
 * cities and content report per audience.
 *
 * @since n.e.x.t
 *
 * @param input The reports context.
 * @return Every report result.
 */
async function fetchAudienceReports(
	input: FetchAudienceReportsInput
): Promise< AudienceReports > {
	const {
		registry,
		dates,
		audienceResourceNames,
		siteKitAudiences,
		isSiteKitAudiencePartialData,
		signal,
	} = input;

	const otherAudienceCount =
		audienceResourceNames.length - siteKitAudiences.length;
	const shouldFetchMainReport =
		otherAudienceCount > 0 || isSiteKitAudiencePartialData === false;
	const shouldFetchSiteKitReport =
		siteKitAudiences.length > 0 && isSiteKitAudiencePartialData === true;

	const { fetchGetReport } = registry.dispatch( MODULES_ANALYTICS_4 );

	/**
	 * Dispatches one report fetch with the export's abort signal attached.
	 *
	 * @since n.e.x.t
	 *
	 * @param options The report options to fetch.
	 * @return The report fetch result.
	 */
	function fetchReport(
		options: ReportOptions
	): Promise< FetchReportResult > {
		return fetchGetReport( options, { signal } );
	}

	const skippedReport: FetchReportResult = {
		response: undefined,
		error: undefined,
	};

	/**
	 * Adds the per-audience dimension filter, like `getReportForAllAudiences`:
	 * `newVsReturning` for a gathering-data Site Kit audience,
	 * `audienceResourceName` for every other.
	 *
	 * @since n.e.x.t
	 *
	 * @param baseOptions          The report options to add the filter to.
	 * @param audienceResourceName The audience the report is scoped to.
	 * @return The report options with the per-audience dimension filter.
	 */
	function perAudienceReportOptions(
		baseOptions: ReportOptions,
		audienceResourceName: string
	): ReportOptions {
		const partialDataSiteKitAudience = registry
			.select( MODULES_ANALYTICS_4 )
			.getPartialDataSiteKitAudience( audienceResourceName );

		const dimensionFilters: Record< string, string > =
			partialDataSiteKitAudience
				? {
						newVsReturning: siteKitAudienceDimensionValue(
							partialDataSiteKitAudience.audienceSlug
						),
				  }
				: { audienceResourceName };

		return {
			...baseOptions,
			dimensionFilters: {
				...baseOptions.dimensionFilters,
				...dimensionFilters,
			},
		};
	}

	const topCitiesOptions = getAudienceTilesTopCitiesReportOptions( dates );
	const topContentOptions = getAudienceTilesTopContentReportOptions( dates );
	const topContentPageTitlesOptions =
		getAudienceTilesTopContentPageTitlesReportOptions( dates );

	const [ mainResult, siteKitResult, totalPageviewsResult, ...cardResults ] =
		await Promise.all( [
			shouldFetchMainReport
				? fetchReport(
						getAudienceTilesMetricsReportOptions(
							dates,
							audienceResourceNames
						)
				  )
				: Promise.resolve( skippedReport ),
			shouldFetchSiteKitReport
				? fetchReport(
						getAudienceTilesSiteKitAudiencesReportOptions( dates )
				  )
				: Promise.resolve( skippedReport ),
			fetchReport( getAudienceTilesTotalPageviewsReportOptions( dates ) ),
			...audienceResourceNames.flatMap(
				( audienceResourceName: string ) => [
					fetchReport(
						perAudienceReportOptions(
							topCitiesOptions,
							audienceResourceName
						)
					),
					fetchReport(
						perAudienceReportOptions(
							topContentOptions,
							audienceResourceName
						)
					),
					fetchReport(
						perAudienceReportOptions(
							topContentPageTitlesOptions,
							audienceResourceName
						)
					),
				]
			),
		] );

	return { mainResult, siteKitResult, totalPageviewsResult, cardResults };
}

/**
 * Loads the audience cards for the "Your visitor groups" PDF widget.
 *
 * It takes the first three configured audiences that are still available,
 * fetches their reports in parallel, and builds a card from each. It drops any
 * audience whose reports failed, and returns `{ data: null }` when fewer than
 * two cards remain, so a single-card row never appears. It captures no charts.
 *
 * @since n.e.x.t
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range, with the current day excluded.
 * @param params.signal   Cancellation signal.
 * @return The loaded audience cards, or `{ data: null }` when the section is omitted or canceled.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< AudienceTilesPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const configuredAudiences = await registry
		.resolveSelect( CORE_USER )
		.getConfiguredAudiences();

	if ( signal.aborted ) {
		return { data: null };
	}

	// Stop early when fewer than two audiences are configured, since the
	// section needs two cards.
	if ( ( configuredAudiences || [] ).length < MIN_AUDIENCE_TILES ) {
		return { data: null };
	}

	await registry
		.resolveSelect( MODULES_ANALYTICS_4 )
		.getOrSyncAvailableAudiences();

	if ( signal.aborted ) {
		return { data: null };
	}

	const availableAudiences: AvailableAudience[] =
		registry.select( MODULES_ANALYTICS_4 ).getOrSyncAvailableAudiences() ||
		[];

	/**
	 * Finds an available audience by its resource name.
	 *
	 * @since n.e.x.t
	 *
	 * @param audienceResourceName The audience resource name to find.
	 * @return The matching available audience, or `undefined` when it is absent.
	 */
	function findAvailableAudience( audienceResourceName: string ) {
		return availableAudiences.find(
			( { name } ) => name === audienceResourceName
		);
	}

	// Drop a configured audience that is no longer in the available audiences,
	// like the dashboard tiles do, so a deleted audience never renders a card
	// with no name and zero values. Then take the first three, so a fourth is
	// never queried.
	const audienceResourceNames: string[] = ( configuredAudiences || [] )
		.filter(
			( audienceResourceName: string ) =>
				!! findAvailableAudience( audienceResourceName )
		)
		.slice( 0, MAX_AUDIENCE_TILES );

	if ( audienceResourceNames.length < MIN_AUDIENCE_TILES ) {
		return { data: null };
	}

	const siteKitAudiences = audienceResourceNames
		.map( findAvailableAudience )
		.filter(
			( audience ): audience is AvailableAudience =>
				audience?.audienceType === 'SITE_KIT_AUDIENCE'
		);

	// Resolve the Site Kit audiences' partial data state first, so the branching
	// selectors below aren't `undefined`. It needs the gathering-data state and
	// each audience's data availability date.
	if ( siteKitAudiences.length > 0 ) {
		await Promise.all( [
			registry.resolveSelect( MODULES_ANALYTICS_4 ).isGatheringData(),
			...siteKitAudiences.map( ( audience ) =>
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getResourceDataAvailabilityDate(
						audience.name,
						RESOURCE_TYPE_AUDIENCE
					)
			),
		] );

		if ( signal.aborted ) {
			return { data: null };
		}
	}

	const isSiteKitAudiencePartialData = registry
		.select( MODULES_ANALYTICS_4 )
		.hasAudiencePartialData( siteKitAudiences );

	const { mainResult, siteKitResult, totalPageviewsResult, cardResults } =
		await fetchAudienceReports( {
			registry,
			dates,
			audienceResourceNames,
			siteKitAudiences,
			isSiteKitAudiencePartialData,
			signal,
		} );

	if ( signal.aborted ) {
		return { data: null };
	}

	const totalPageviews =
		Number(
			totalPageviewsResult.response?.totals?.[ 0 ]?.metricValues?.[ 0 ]
				?.value
		) || 0;

	const audiences = audienceResourceNames
		.map( ( audienceResourceName: string, index: number ) => {
			const audience = findAvailableAudience( audienceResourceName );
			const usesSiteKitReport =
				audience?.audienceType === 'SITE_KIT_AUDIENCE' &&
				isSiteKitAudiencePartialData === true;
			const offset = index * REPORTS_PER_AUDIENCE;

			return buildAudienceCard( {
				audienceResourceName,
				audience,
				usesSiteKitReport,
				metricsResult: usesSiteKitReport ? siteKitResult : mainResult,
				topCitiesResult: cardResults[ offset ],
				topContentResult: cardResults[ offset + 1 ],
				topContentPageTitlesResult: cardResults[ offset + 2 ],
				totalPageviews,
			} );
		} )
		.filter( ( audience ): audience is AudienceTilePDFData => !! audience );

	// Omit the whole section when fewer than two cards loaded, so a single-card row
	// never appears.
	if ( audiences.length < MIN_AUDIENCE_TILES ) {
		return { data: null };
	}

	return { data: { audiences } };
}
