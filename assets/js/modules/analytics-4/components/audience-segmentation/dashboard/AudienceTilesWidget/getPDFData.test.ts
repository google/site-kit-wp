/**
 * Your visitor groups getPDFData tests.
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
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import type { AudienceTilePDFData } from './buildPDFAudienceCard';
import getPDFData, { AudienceTilesPDFData } from './getPDFData';

type PDFRegistry = Parameters< typeof getPDFData >[ 0 ][ 'registry' ];

const PROPERTY = 'properties/123';
const OTHER_A = `${ PROPERTY }/audiences/1`;
const SITE_KIT = `${ PROPERTY }/audiences/2`;
const OTHER_B = `${ PROPERTY }/audiences/3`;
const FOURTH = `${ PROPERTY }/audiences/4`;

const AVAILABLE_AUDIENCES = [
	{ name: OTHER_A, displayName: 'Custom A', audienceType: 'USER_AUDIENCE' },
	{
		name: SITE_KIT,
		displayName: 'New visitors',
		audienceType: 'SITE_KIT_AUDIENCE',
		audienceSlug: 'new-visitors',
	},
	{ name: OTHER_B, displayName: 'Custom B', audienceType: 'USER_AUDIENCE' },
	{ name: FOURTH, displayName: 'Custom C', audienceType: 'USER_AUDIENCE' },
];

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * Builds the two metric rows (current and previous) for one dimension value.
 *
 * @since n.e.x.t
 *
 * @param dimensionValue The audience dimension value the rows belong to.
 * @param base           The base metric value; the previous row adds one.
 * @return The current and previous metric rows.
 */
function metricRows( dimensionValue: string, base: number ) {
	return [ 'date_range_0', 'date_range_1' ].map( ( dateRange, index ) => ( {
		dimensionValues: [ { value: dimensionValue }, { value: dateRange } ],
		metricValues: [
			{ value: String( base + index ) }, // totalUsers
			{ value: '2' }, // sessionsPerUser
			{ value: '3' }, // screenPageViewsPerSession
			{ value: String( base * 10 + index ) }, // screenPageViews
		],
	} ) );
}

/**
 * Builds a mock registry and a `fetchGetReport` spy for `getPDFData`.
 *
 * @since n.e.x.t
 *
 * @param options                      Setup options.
 * @param options.configuredAudiences  Configured audience resource names.
 * @param options.isSiteKitPartialData Whether the Site Kit audiences are in a partial data state.
 * @param options.failing              Report IDs, or `id::audience` keys, that resolve with an error.
 * @param options.totalPageviews       The site-wide total pageviews.
 * @return The registry and the `fetchGetReport` spy.
 */
function buildRegistry( {
	configuredAudiences = [ OTHER_A, SITE_KIT, OTHER_B ],
	isSiteKitPartialData = false,
	failing = new Set< string >(),
	totalPageviews = 2000,
}: {
	configuredAudiences?: string[];
	isSiteKitPartialData?: boolean;
	failing?: Set< string >;
	totalPageviews?: number;
} = {} ) {
	const fetchGetReport = jest.fn( ( options: ReportOptions ) => {
		const { reportID = '', dimensionFilters = {} } = options;
		const filterValue =
			dimensionFilters.audienceResourceName ||
			dimensionFilters.newVsReturning;
		const audienceKey = Array.isArray( filterValue )
			? undefined
			: filterValue;

		if (
			failing.has( reportID ) ||
			( audienceKey && failing.has( `${ reportID }::${ audienceKey }` ) )
		) {
			return Promise.resolve( { error: { message: 'failed' } } );
		}

		if ( reportID.includes( 'hook_reportOptions' ) ) {
			return Promise.resolve( {
				response: {
					rows: [
						...metricRows( OTHER_A, 100 ),
						...metricRows( OTHER_B, 300 ),
					],
				},
			} );
		}
		if ( reportID.includes( 'newVsReturningReportOptions' ) ) {
			return Promise.resolve( {
				response: { rows: metricRows( 'new', 200 ) },
			} );
		}
		if ( reportID.includes( 'totalPageviewsReportOptions' ) ) {
			return Promise.resolve( {
				response: {
					totals: [
						{
							metricValues: [
								{ value: String( totalPageviews ) },
							],
						},
					],
				},
			} );
		}
		if ( reportID.includes( 'topCitiesReportOptions' ) ) {
			return Promise.resolve( {
				response: {
					rows: [
						{
							dimensionValues: [ { value: 'Dublin' } ],
							metricValues: [ { value: '40' } ],
						},
						{
							dimensionValues: [ { value: '(not set)' } ],
							metricValues: [ { value: '5' } ],
						},
					],
				},
			} );
		}
		if ( reportID.includes( 'topContentPageTitlesReportOptions' ) ) {
			return Promise.resolve( {
				response: {
					rows: [
						{
							dimensionValues: [
								{ value: '/post-1' },
								{ value: 'Post One' },
							],
						},
					],
				},
			} );
		}
		if ( reportID.includes( 'topContentReportOptions' ) ) {
			return Promise.resolve( {
				response: {
					rows: [
						{
							dimensionValues: [ { value: '/post-1' } ],
							metricValues: [ { value: '80' } ],
						},
					],
				},
			} );
		}

		return Promise.resolve( { response: { rows: [] } } );
	} );

	const analytics4Selectors = {
		getOrSyncAvailableAudiences: () => AVAILABLE_AUDIENCES,
		hasAudiencePartialData: () => isSiteKitPartialData,
		getPartialDataSiteKitAudience: ( name: string ) => {
			const found = AVAILABLE_AUDIENCES.find(
				( item ) => item.name === name
			);
			if ( found?.audienceType !== 'SITE_KIT_AUDIENCE' ) {
				return null;
			}
			return isSiteKitPartialData ? found : null;
		},
		// Serializes the report type, the page filter, and the date range into
		// the link. A test then proves what the loader asked the selector by
		// reading the link a top content row holds.
		getServiceReportURL: (
			type: string,
			{
				filters,
				dates,
			}: {
				filters: { unifiedPagePathScreen: string };
				dates: { startDate: string; endDate: string };
			}
		) =>
			`https://example.com/analytics-report/${ type }?path=${ filters.unifiedPagePathScreen }&range=${ dates.startDate }:${ dates.endDate }`,
	};

	// The loader reads only `resolveSelect`, `select`, and `dispatch`. The mock
	// stubs those three, then casts to the full registry type the loader's
	// parameters declare.
	const registry = {
		resolveSelect: () => ( {
			getConfiguredAudiences: () =>
				Promise.resolve( configuredAudiences ),
			getOrSyncAvailableAudiences: () =>
				Promise.resolve( AVAILABLE_AUDIENCES ),
			isGatheringData: () => Promise.resolve( false ),
			getResourceDataAvailabilityDate: () => Promise.resolve( 20240101 ),
		} ),
		select: () => analytics4Selectors,
		dispatch: () => ( { fetchGetReport } ),
	} as unknown as PDFRegistry;

	return { registry, fetchGetReport };
}

/**
 * Runs `getPDFData` with a real abort signal.
 *
 * @since n.e.x.t
 *
 * @param {PDFRegistry} registry         The mock registry.
 * @param {Object}      options          Run options.
 * @param {boolean}     options.aborted  Whether the signal aborts before the run.
 * @param {boolean}     options.viewOnly Whether the export runs on a view-only dashboard.
 * @return {Promise<Object>} The loader result.
 */
function runPDFData(
	registry: PDFRegistry,
	{
		aborted = false,
		viewOnly = false,
	}: { aborted?: boolean; viewOnly?: boolean } = {}
) {
	const controller = new AbortController();
	if ( aborted ) {
		controller.abort();
	}
	return getPDFData( {
		registry,
		dates: DATES,
		signal: controller.signal,
		viewOnly,
	} );
}

/**
 * Returns the loaded audiences, or throws when the section was omitted.
 *
 * @since n.e.x.t
 *
 * @param result The loader result.
 * @return The loaded audience cards.
 */
function getAudiences( result: AudienceTilesPDFData ): AudienceTilePDFData[] {
	if ( ! result.data ) {
		throw new Error( 'Expected audiences data, got null.' );
	}
	return result.data.audiences;
}

/**
 * Finds one audience card by its resource name, or throws when it is absent.
 *
 * @since n.e.x.t
 *
 * @param audiences The loaded audience cards.
 * @param name      The audience resource name to find.
 * @return The matching card.
 */
function findCard(
	audiences: AudienceTilePDFData[],
	name: string
): AudienceTilePDFData {
	const card = audiences.find(
		( audience ) => audience.audienceResourceName === name
	);
	if ( ! card ) {
		throw new Error( `Expected a card for ${ name }.` );
	}
	return card;
}

describe( 'AudienceTilesWidget getPDFData', () => {
	it( 'queries only the first three configured audiences, never a fourth', async () => {
		const { registry, fetchGetReport } = buildRegistry( {
			configuredAudiences: [ OTHER_A, SITE_KIT, OTHER_B, FOURTH ],
		} );

		const audiences = getAudiences( await runPDFData( registry ) );

		expect( audiences ).toHaveLength( 3 );

		expect( JSON.stringify( fetchGetReport.mock.calls ) ).not.toContain(
			FOURTH
		);

		const mainCall = fetchGetReport.mock.calls.find( ( [ options ] ) =>
			options.reportID?.includes( 'hook_reportOptions' )
		);
		expect(
			mainCall?.[ 0 ]?.dimensionFilters?.audienceResourceName
		).toEqual( [ OTHER_A, SITE_KIT, OTHER_B ] );
	} );

	it( 'drops a configured audience that is no longer available, so the next configured audience renders instead', async () => {
		// A configured audience that is absent from the available audiences,
		// like an audience deleted in Analytics after the user configured it.
		const deletedAudience = `${ PROPERTY }/audiences/9`;
		const { registry, fetchGetReport } = buildRegistry( {
			configuredAudiences: [
				OTHER_A,
				deletedAudience,
				SITE_KIT,
				OTHER_B,
			],
		} );

		const audiences = getAudiences( await runPDFData( registry ) );

		// The deleted audience never renders a card and is never queried. The
		// dashboard tiles drop it the same way.
		expect(
			audiences.map( ( audience ) => audience.audienceResourceName )
		).toEqual( [ OTHER_A, SITE_KIT, OTHER_B ] );
		expect( JSON.stringify( fetchGetReport.mock.calls ) ).not.toContain(
			deletedAudience
		);
	} );

	it( 'passes the abort signal to every fetchGetReport call', async () => {
		const controller = new AbortController();
		const { registry, fetchGetReport } = buildRegistry();

		await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
			viewOnly: false,
		} );

		expect( fetchGetReport ).toHaveBeenCalled();
		// The mock signature types one parameter, but the loader passes a
		// second (the fetch options), so read it from the raw call arguments.
		const calls = fetchGetReport.mock.calls as unknown as Array<
			[ ReportOptions, { signal: AbortSignal } ]
		>;
		calls.forEach( ( [ , fetchOptions ] ) => {
			expect( fetchOptions ).toEqual( { signal: controller.signal } );
		} );
	} );

	it( 'reads a partial-data Site Kit audience from the newVsReturning report', async () => {
		const { registry, fetchGetReport } = buildRegistry( {
			isSiteKitPartialData: true,
		} );

		const audiences = getAudiences( await runPDFData( registry ) );

		// The Site Kit audience reads from the `newVsReturning` fallback report.
		expect(
			fetchGetReport.mock.calls.some( ( [ options ] ) =>
				options.reportID?.includes( 'newVsReturningReportOptions' )
			)
		).toBe( true );

		// The `new` rows in the `newVsReturning` report use a base of 200.
		expect( findCard( audiences, SITE_KIT ).metrics.visitors.current ).toBe(
			200
		);
	} );

	it( 'gives all four metrics a current and previous value', async () => {
		const { registry } = buildRegistry();

		const audiences = getAudiences( await runPDFData( registry ) );
		const card = findCard( audiences, OTHER_A );

		expect( card.metrics.visitors ).toEqual( {
			current: 100,
			previous: 101,
		} );
		expect( card.metrics.visitsPerVisitor ).toEqual( {
			current: 2,
			previous: 2,
		} );
		expect( card.metrics.pagesPerVisit ).toEqual( {
			current: 3,
			previous: 3,
		} );
		expect( card.metrics.pageviews.current ).toBe( 1000 );
		expect( card.metrics.pageviews.previous ).toBe( 1001 );
		expect( card.metrics.pageviews.percentageOfTotalPageViews ).toBeCloseTo(
			1000 / 2000
		);
	} );

	it( 'builds top cities and content, dropping (not set) and resolving page titles', async () => {
		const { registry } = buildRegistry();

		const audiences = getAudiences( await runPDFData( registry ) );
		const card = audiences[ 0 ];

		expect( card.topCities ).toEqual( [
			{ name: 'Dublin', percentage: 40 / card.metrics.visitors.current },
		] );
		expect( card.topContent ).toEqual( [
			{
				title: 'Post One',
				pageviews: 80,
				serviceURL: `https://example.com/analytics-report/all-pages-and-screens?path=/post-1&range=${ DATES.startDate }:${ DATES.endDate }`,
			},
		] );
	} );

	it( 'links each top content page to the same All pages and screens report the dashboard tile links to', async () => {
		const { registry } = buildRegistry();

		const audiences = getAudiences( await runPDFData( registry ) );

		// The stub selector serializes its type, page filter, and date range
		// into the link. So this equality proves the loader asks the same
		// selector the dashboard tile asks, with the page path and the report
		// date range.
		audiences.forEach( ( audience ) => {
			expect( audience.topContent[ 0 ].serviceURL ).toBe(
				`https://example.com/analytics-report/all-pages-and-screens?path=/post-1&range=${ DATES.startDate }:${ DATES.endDate }`
			);
		} );
	} );

	it( 'builds no top content links on a view-only dashboard', async () => {
		const { registry } = buildRegistry();

		const audiences = getAudiences(
			await runPDFData( registry, { viewOnly: true } )
		);

		// The dashboard tile shows a view-only user each page title as plain
		// text, so every card's top content rows hold no link.
		const contentRows = audiences.flatMap(
			( audience ) => audience.topContent
		);
		expect( contentRows ).not.toHaveLength( 0 );
		contentRows.forEach( ( content ) => {
			expect( content.serviceURL ).toBe( '' );
		} );
	} );

	it( 'excludes a failed audience while the other two still load', async () => {
		const { registry } = buildRegistry( {
			failing: new Set( [
				`audience-segmentation_use-audience-tiles-reports_hook_topCitiesReportOptions::${ OTHER_B }`,
			] ),
		} );

		const audiences = getAudiences( await runPDFData( registry ) );

		expect( audiences ).toHaveLength( 2 );
		expect(
			audiences.map( ( audience ) => audience.audienceResourceName )
		).toEqual( [ OTHER_A, SITE_KIT ] );
	} );

	it( 'omits the whole section when fewer than two audiences load', async () => {
		const { registry } = buildRegistry( {
			failing: new Set( [
				`audience-segmentation_use-audience-tiles-reports_hook_topCitiesReportOptions::${ SITE_KIT }`,
				`audience-segmentation_use-audience-tiles-reports_hook_topCitiesReportOptions::${ OTHER_B }`,
			] ),
		} );

		const { data } = await runPDFData( registry );

		expect( data ).toBeNull();
	} );

	it( 'omits the whole section when fewer than two audiences are configured', async () => {
		const { registry, fetchGetReport } = buildRegistry( {
			configuredAudiences: [ OTHER_A ],
		} );

		const { data } = await runPDFData( registry );

		expect( data ).toBeNull();
		expect( fetchGetReport ).not.toHaveBeenCalled();
	} );

	it( 'fetches nothing when the signal is already aborted', async () => {
		const { registry, fetchGetReport } = buildRegistry();

		const { data } = await runPDFData( registry, { aborted: true } );

		expect( data ).toBeNull();
		expect( fetchGetReport ).not.toHaveBeenCalled();
	} );
} );
