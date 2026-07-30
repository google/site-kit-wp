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
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import {
	CUSTOM_DIMENSION_DEFINITIONS,
	MODULES_ANALYTICS_4,
	RESOURCE_TYPE_AUDIENCE,
	RESOURCE_TYPE_CUSTOM_DIMENSION,
	RESOURCE_TYPE_PROPERTY,
} from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import {
	getAudienceTilesMetricsReportOptions,
	getAudienceTilesSiteKitAudiencesReportOptions,
	getAudienceTilesTopCitiesReportOptions,
	getAudienceTilesTopContentPageTitlesReportOptions,
	getAudienceTilesTopContentReportOptions,
	getAudienceTilesTotalPageviewsReportOptions,
} from '@/js/modules/analytics-4/utils/audienceTilesReportOptions';
import { getAllPagesReportURL } from '@/js/modules/analytics-4/utils/page-report-url';
import {
	AudienceTilePDFData,
	AvailableAudience,
	FetchReportResult,
	buildPDFAudienceCard,
	siteKitAudienceDimensionValue,
} from './buildPDFAudienceCard';

/** The section needs at least two cards, so a single-card row never appears. */
const MIN_AUDIENCE_TILES = 2;
/** The row shows at most three cards, the first three configured audiences. */
const MAX_AUDIENCE_TILES = 3;
/** Each audience fetches its own cities, content, and content page titles reports. */
const REPORTS_PER_AUDIENCE = 3;

const postTypeDimension =
	CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type.parameterName;

/** The loaded audience cards, or `null` when the section is omitted. */
export interface AudienceTilesPDFData {
	data: {
		/** The successfully loaded audience cards, two or three of them. */
		audiences: AudienceTilePDFData[];
	} | null;
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
 * @since 1.184.0
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
	 * @since 1.184.0
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
	 * @since 1.184.0
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

/** The two partial-data flags one audience card renders its badges from. */
export interface AudiencePartialDataFlags {
	/** Whether the audience is still collecting full data for the date range. */
	isAudiencePartialData: boolean;
	/** Whether the `googlesitekit_post_type` custom dimension is still collecting full data for the date range. */
	isTopContentPartialData: boolean;
}

/**
 * Reads one audience's partial-data flags, mirroring the dashboard tile.
 *
 * The dashboard tile's `AudienceTile/index.js` derives the two flags from the
 * property, audience, and custom dimension partial-data selectors, in the same
 * order:
 *
 * - A partial-data property, or one still loading, clears both flags.
 * - A Site Kit audience clears `isAudiencePartialData`.
 * - A set `isAudiencePartialData` clears `isTopContentPartialData`.
 *
 * @since n.e.x.t
 *
 * @param registry             WordPress data registry.
 * @param propertyID           The Analytics 4 property ID, or an empty string when none is set.
 * @param audienceResourceName The audience the flags are read for.
 * @return The audience's two partial-data flags.
 */
export function getAudiencePartialDataFlags(
	registry: GetPDFDataParams[ 'registry' ],
	propertyID: string,
	audienceResourceName: string
): AudiencePartialDataFlags {
	const isPropertyPartialData = propertyID
		? registry
				.select( MODULES_ANALYTICS_4 )
				.isPropertyPartialData( propertyID )
		: undefined;

	// A property still loading its partial-data state clears both flags.
	if ( isPropertyPartialData === undefined ) {
		return {
			isAudiencePartialData: false,
			isTopContentPartialData: false,
		};
	}

	const isSiteKitAudience = registry
		.select( MODULES_ANALYTICS_4 )
		.isSiteKitAudience( audienceResourceName );

	// A Site Kit audience, or a partial-data property, clears the header flag.
	const isAudiencePartialData =
		! isSiteKitAudience &&
		! isPropertyPartialData &&
		!! audienceResourceName &&
		!! registry
			.select( MODULES_ANALYTICS_4 )
			.isAudiencePartialData( audienceResourceName );

	// A partial-data property or audience clears the top content flag.
	const isTopContentPartialData =
		! isPropertyPartialData &&
		! isAudiencePartialData &&
		!! registry
			.select( MODULES_ANALYTICS_4 )
			.isCustomDimensionPartialData( postTypeDimension );

	return { isAudiencePartialData, isTopContentPartialData };
}

/**
 * Loads the audience cards for the "Your visitor groups" PDF widget.
 *
 * It takes the first three configured audiences that are still available,
 * fetches their reports in parallel, and builds a card from each. It drops any
 * audience whose reports failed, and returns `{ data: null }` when fewer than
 * two cards remain, so a single-card row never appears. It captures no charts.
 * For a view-only user, the loader builds no top content links, because the
 * dashboard tile shows each page title as plain text.
 *
 * @since 1.184.0
 *
 * @param {Object}      params          Loader parameters.
 * @param {Object}      params.registry WordPress data registry.
 * @param {Object}      params.dates    Report date range, with the current day excluded.
 * @param {AbortSignal} params.signal   Cancellation signal.
 * @param {boolean}     params.viewOnly Whether the export runs on a view-only dashboard.
 * @return {Promise<Object>} The loaded audience cards, or `{ data: null }` when the loader omits the section or the user cancels the export.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
	viewOnly,
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
	 * @since 1.184.0
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

	/**
	 * Resolves the property ID and the property, audience, and custom dimension
	 * partial-data states, so the synchronous flag selectors below never read an
	 * `undefined` value.
	 *
	 * @since n.e.x.t
	 *
	 * @return {string} Property ID, or an empty string when none is set.
	 */
	async function resolvePartialDataInputs() {
		await registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings();

		const propertyID = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyID();

		await Promise.all( [
			...( propertyID
				? [
						registry
							.resolveSelect( MODULES_ANALYTICS_4 )
							.getResourceDataAvailabilityDate(
								propertyID,
								RESOURCE_TYPE_PROPERTY
							),
				  ]
				: [] ),
			...audienceResourceNames.map( ( audienceResourceName: string ) =>
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getResourceDataAvailabilityDate(
						audienceResourceName,
						RESOURCE_TYPE_AUDIENCE
					)
			),
			registry
				.resolveSelect( MODULES_ANALYTICS_4 )
				.getResourceDataAvailabilityDate(
					postTypeDimension,
					RESOURCE_TYPE_CUSTOM_DIMENSION
				),
		] );

		return propertyID;
	}

	// Fetch the reports and resolve the store data the per-card partial-data
	// flags read in parallel, so the synchronous flag selectors below never read
	// an `undefined` value.
	const [
		propertyID,
		{ mainResult, siteKitResult, totalPageviewsResult, cardResults },
	] = await Promise.all( [
		resolvePartialDataInputs(),
		fetchAudienceReports( {
			registry,
			dates,
			audienceResourceNames,
			siteKitAudiences,
			isSiteKitAudiencePartialData,
			signal,
		} ),
	] );

	if ( signal.aborted ) {
		return { data: null };
	}

	const totalPageviews =
		Number(
			totalPageviewsResult.response?.totals?.[ 0 ]?.metricValues?.[ 0 ]
				?.value
		) || 0;

	/**
	 * Maps a top content page path to its Analytics report link.
	 *
	 * Each page title links to the same All pages and screens report the
	 * dashboard tile links to. For a view-only user, this function resolves no
	 * link, so each page title renders as plain text, matching how the
	 * dashboard tile shows it.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} pagePath Page path of a top content row.
	 * @return {string} The page's Analytics report link, or an empty string for a view-only user.
	 */
	function getContentServiceURL( pagePath: string ): string {
		if ( viewOnly ) {
			return '';
		}

		const { startDate, endDate } = dates;

		return (
			getAllPagesReportURL(
				registry.select( MODULES_ANALYTICS_4 ),
				pagePath,
				{ startDate, endDate }
			) ?? ''
		);
	}

	const audiences = audienceResourceNames
		.map( ( audienceResourceName: string, index: number ) => {
			const audience = findAvailableAudience( audienceResourceName );
			const usesSiteKitReport =
				audience?.audienceType === 'SITE_KIT_AUDIENCE' &&
				isSiteKitAudiencePartialData === true;
			const offset = index * REPORTS_PER_AUDIENCE;

			const { isAudiencePartialData, isTopContentPartialData } =
				getAudiencePartialDataFlags(
					registry,
					propertyID,
					audienceResourceName
				);

			return buildPDFAudienceCard( {
				audienceResourceName,
				audience,
				usesSiteKitReport,
				metricsResult: usesSiteKitReport ? siteKitResult : mainResult,
				topCitiesResult: cardResults[ offset ],
				topContentResult: cardResults[ offset + 1 ],
				topContentPageTitlesResult: cardResults[ offset + 2 ],
				totalPageviews,
				isAudiencePartialData,
				isTopContentPartialData,
				getContentServiceURL,
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
