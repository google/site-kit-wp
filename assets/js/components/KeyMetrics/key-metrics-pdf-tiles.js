/**
 * Key Metrics PDF tile configurations.
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
import getPDFTileChange from '@/js/components/pdf-export/getPDFTileChange';
import lazyWithPreload from '@/js/components/pdf-export/lazy-with-preload';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE,
	KM_ANALYTICS_FORM_COMPLETION_RATE,
	KM_ANALYTICS_LEADS_BY_COUNTRIES,
	KM_ANALYTICS_LEADS_BY_DEVICE_TYPE,
	KM_ANALYTICS_LEADS_BY_VISITOR_TYPE,
	KM_ANALYTICS_LEAST_ENGAGING_PAGES,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_SALES_BY_COUNTRIES,
	KM_ANALYTICS_SALES_BY_VISITOR_TYPE,
	KM_ANALYTICS_SALES_ENGAGEMENT_RATE,
	KM_ANALYTICS_SALES_RATE,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_PAGES_DRIVING_SALES,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_FORM_COMPLETION_RATE,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOTAL_FORM_COMPLETIONS,
	KM_ANALYTICS_TOTAL_SALES,
	KM_ANALYTICS_VISITS_PER_VISITOR,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '@/js/googlesitekit/datastore/user/constants';
import { getTopEarningContentReportOptions } from '@/js/modules/adsense/components/widgets/TopEarningContentWidget';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import {
	GOAL_DRIVER_IDS,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	GOAL_DRIVER_REPORT_OPTIONS_BUILDERS,
	GOAL_DRIVER_ROW_MAPPERS,
	buildEngagementReportOptions,
	buildPrimaryEventReportOptions,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { processReports } from '@/js/modules/analytics-4/components/site-goals/utils/reports';
import {
	getEngagedTrafficSourceReportOptions,
	getEngagedTrafficSourceSubtext,
} from '@/js/modules/analytics-4/components/widgets/EngagedTrafficSourceWidget';
import { getLeastEngagingPagesReportOptions } from '@/js/modules/analytics-4/components/widgets/LeastEngagingPagesWidget';
import { getMostEngagingPagesReportOptions } from '@/js/modules/analytics-4/components/widgets/MostEngagingPagesWidget';
import {
	getNewVisitorsReportOptions,
	getNewVisitorsSubtext,
} from '@/js/modules/analytics-4/components/widgets/NewVisitorsWidget';
import {
	getPagesPerVisitReportOptions,
	getPagesPerVisitSubtext,
} from '@/js/modules/analytics-4/components/widgets/PagesPerVisitWidget';
import { getPopularAuthorsReportOptions } from '@/js/modules/analytics-4/components/widgets/PopularAuthorsWidget';
import { getPopularContentReportOptions } from '@/js/modules/analytics-4/components/widgets/PopularContentWidget';
import { getPopularProductsReportOptions } from '@/js/modules/analytics-4/components/widgets/PopularProductsWidget';
import {
	getReturningVisitorsReportOptions,
	getReturningVisitorsSubtext,
} from '@/js/modules/analytics-4/components/widgets/ReturningVisitorsWidget';
import { getTopCategoriesReportOptions } from '@/js/modules/analytics-4/components/widgets/TopCategoriesWidget';
import { getTopCitiesDrivingAddToCartReportOptions } from '@/js/modules/analytics-4/components/widgets/TopCitiesDrivingAddToCartWidget';
import {
	getTopCitiesDrivingLeadsEventNames,
	getTopCitiesDrivingLeadsReportOptions,
} from '@/js/modules/analytics-4/components/widgets/TopCitiesDrivingLeadsWidget';
import { getTopCitiesDrivingPurchasesReportOptions } from '@/js/modules/analytics-4/components/widgets/TopCitiesDrivingPurchasesWidget';
import { getTopCitiesReportOptions } from '@/js/modules/analytics-4/components/widgets/TopCitiesWidget';
import {
	getTopConvertingTrafficSourceReportOptions,
	getTopConvertingTrafficSourceSubtext,
} from '@/js/modules/analytics-4/components/widgets/TopConvertingTrafficSourceWidget';
import { getTopCountriesReportOptions } from '@/js/modules/analytics-4/components/widgets/TopCountriesWidget';
import {
	getTopDeviceDrivingPurchasesReportOptions,
	getTopDeviceDrivingPurchasesSubtext,
} from '@/js/modules/analytics-4/components/widgets/TopDeviceDrivingPurchasesWidget';
import {
	getTopPagesDrivingLeadsEventNames,
	getTopPagesDrivingLeadsReportOptions,
} from '@/js/modules/analytics-4/components/widgets/TopPagesDrivingLeadsWidget';
import {
	getDateRange,
	getTopRecentTrendingPagesReportOptions,
} from '@/js/modules/analytics-4/components/widgets/TopRecentTrendingPagesWidget';
import { getTopReturningVisitorPagesReportOptions } from '@/js/modules/analytics-4/components/widgets/TopReturningVisitorPages';
import {
	getTopTrafficSourceDrivingAddToCartReportOptions,
	getTopTrafficSourceDrivingAddToCartSubtext,
} from '@/js/modules/analytics-4/components/widgets/TopTrafficSourceDrivingAddToCartWidget';
import {
	getTopTrafficSourceDrivingLeadsEventNames,
	getTopTrafficSourceDrivingLeadsReportOptions,
	getTopTrafficSourceDrivingLeadsSubtext,
} from '@/js/modules/analytics-4/components/widgets/TopTrafficSourceDrivingLeadsWidget';
import {
	getTopTrafficSourceDrivingPurchasesReportOptions,
	getTopTrafficSourceDrivingPurchasesSubtext,
} from '@/js/modules/analytics-4/components/widgets/TopTrafficSourceDrivingPurchasesWidget';
import {
	getTopTrafficSourceReportOptions,
	getTopTrafficSourceSubtext,
} from '@/js/modules/analytics-4/components/widgets/TopTrafficSourceWidget';
import {
	getVisitLengthReportOptions,
	getVisitLengthSubtext,
} from '@/js/modules/analytics-4/components/widgets/VisitLengthWidget';
import {
	getVisitsPerVisitorReportOptions,
	getVisitsPerVisitorSubtext,
} from '@/js/modules/analytics-4/components/widgets/VisitsPerVisitorWidget';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	decodeAmpersand,
	splitCategories,
} from '@/js/modules/analytics-4/utils';
import { getPageReportURL } from '@/js/modules/analytics-4/utils/page-report-url';
import {
	getPagePaths,
	getPageTitleMap,
	getPageTitlesReportOptions,
} from '@/js/modules/analytics-4/utils/page-titles-report';
import { reportRowsWithSetValues } from '@/js/modules/analytics-4/utils/report-rows-with-set-values';
import {
	getPopularKeywordReportURL,
	getPopularKeywordsReportOptions,
} from '@/js/modules/search-console/components/widgets/PopularKeywordsWidget';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { listFormat, numFmt } from '@/js/util';
import createKeyMetricTileDataLoader from './create-key-metric-tile-data-loader';

/**
 * The Key Metrics PDF tile components, lazy-loaded into the PDF chunk so
 * `@react-pdf/renderer` stays out of the dashboard bundle. Each metric's
 * `pdfTile.TileComponent` references the one that matches its tile shape.
 */
const PDFNumericMetricTile = lazyWithPreload( () =>
	import(
		/* webpackChunkName: "googlesitekit-vendor-lazy-pdf" */
		'@/js/components/pdf-export/shared-react-pdf-components/PDFNumericMetricTile'
	)
);
const PDFMetricTileText = lazyWithPreload( () =>
	import(
		/* webpackChunkName: "googlesitekit-vendor-lazy-pdf" */
		'@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTileText'
	)
);
const PDFMetricTileTable = lazyWithPreload( () =>
	import(
		/* webpackChunkName: "googlesitekit-vendor-lazy-pdf" */
		'@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTileTable'
	)
);

/**
 * The percentage format the text tiles share for their share/rate values,
 * matching the dashboard tiles.
 */
const TILE_PERCENT_FORMAT = {
	style: 'percent',
	signDisplay: 'never',
	maximumFractionDigits: 1,
};

/**
 * Narrows the export's date range to a single period for the table tiles.
 *
 * The PDF export always carries compare dates, because the numeric and text
 * tiles need the previous period for their change badge. The table tiles mirror
 * dashboard widgets that request a single range, so passing the compare dates
 * through would make Analytics 4 append a `dateRange` dimension and return
 * previous-period rows the table would then show. Table tiles build their report
 * options from this instead of the raw `dates`.
 *
 * @since 1.186.0
 *
 * @param {Object} dates The export date range, including the compare dates.
 * @return {Object} The date range with only `startDate` and `endDate`.
 */
function pdfTableDates( dates ) {
	return { startDate: dates.startDate, endDate: dates.endDate };
}

/**
 * Resolves the primary ecommerce event for a Selling products PDF tile.
 *
 * `getPrimaryEcommerceEvent` derives from `getDetectedEvents` but has no
 * resolver of its own, so this resolves the detected events first and reads
 * the derived value once they're in.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry WordPress data registry.
 * @return {Promise<string|undefined>} The primary ecommerce event name, or `undefined` if none is detected.
 */
async function resolvePrimaryEcommerceEvent( registry ) {
	await registry.resolveSelect( MODULES_ANALYTICS_4 ).getDetectedEvents();

	return registry.select( MODULES_ANALYTICS_4 ).getPrimaryEcommerceEvent();
}

/**
 * Maps ranked report rows to `PDFMetricTileTable` rows for a page-based tile:
 * resolves each row's page path to its Analytics report link (matching the
 * dashboard row's own link) and delegates the primary label and metric
 * formatting to the caller.
 *
 * The Analytics selector is the same for every row, so it is resolved once
 * here rather than per row; callers pass the row link's date range already
 * narrowed to the single period the tile's own report uses (most tiles via
 * `pdfTableDates`, "Top recent trending pages" via its own fixed window).
 *
 * @since 1.186.0
 *
 * @param {Object[]} rows               The report rows to map.
 * @param {Object}   context            Link-building context.
 * @param {Object}   context.registry   WordPress data registry.
 * @param {Object}   context.dates      The single-period date range the row's link filters to.
 * @param {boolean}  context.viewOnly   Whether the export runs on a view-only dashboard.
 * @param {Object}   formatters         Per-tile row formatters.
 * @param {Function} formatters.primary Maps a row and its page path to the primary label.
 * @param {Function} formatters.metric  Maps a row to the formatted metric.
 * @return {Object[]} The mapped `PDFMetricTileTable` rows.
 */
function mapPageRows(
	rows,
	{ registry, dates, viewOnly },
	{ primary, metric }
) {
	const analytics = registry.select( MODULES_ANALYTICS_4 );

	return rows.map( ( row ) => {
		const pagePath = row?.dimensionValues?.[ 0 ]?.value;
		return {
			primary: primary( row, pagePath ),
			primaryURL: getPageReportURL( {
				analytics,
				pagePath,
				dates,
				viewOnly,
			} ),
			metric: metric( row ),
		};
	} );
}

/**
 * Extracts a "top source share" text tile from a total report and a per-source
 * report, mirroring the dashboard's relative-share traffic/device tiles.
 *
 * The per-source report is ordered so its first row per date range is the top
 * source; its share is that source's metric over the total report's metric. The
 * change is the absolute point difference, matching the dashboard badge.
 *
 * @since 1.186.0
 *
 * @param {Object}   totalReport  The total-metric report response.
 * @param {Object}   sourceReport The per-source report response.
 * @param {Function} buildSubtext Maps the current share to the tile's sub-text.
 * @return {Object|null} The tile data, or `null` when there is no top source.
 */
function extractTopSourceShareTile( totalReport, sourceReport, buildSubtext ) {
	const { rows: totalRows = [] } = totalReport || {};
	const { rows: sourceRows = [] } = sourceReport || {};

	function sourceRowFor( dateRange ) {
		return sourceRows.find(
			( row ) => row?.dimensionValues?.[ 1 ]?.value === dateRange
		);
	}
	function totalFor( dateRange ) {
		return (
			Number(
				totalRows.find(
					( row ) => row?.dimensionValues?.[ 0 ]?.value === dateRange
				)?.metricValues?.[ 0 ]?.value
			) || 0
		);
	}

	const topSource =
		sourceRowFor( 'date_range_0' )?.dimensionValues?.[ 0 ]?.value;

	// No top source row means the report has no data, so drop the tile.
	if ( ! topSource ) {
		return null;
	}

	function rateFor( dateRange ) {
		const total = totalFor( dateRange );
		const sourceValue =
			Number( sourceRowFor( dateRange )?.metricValues?.[ 0 ]?.value ) ||
			0;
		return total ? sourceValue / total : 0;
	}

	const currentRate = rateFor( 'date_range_0' );
	const previousRate = rateFor( 'date_range_1' );

	return {
		value: topSource,
		subtext: buildSubtext( currentRate ),
		...getPDFTileChange( previousRate, currentRate, { isAbsolute: true } ),
	};
}

/**
 * Each Key Metric's PDF export configuration, keyed by metric slug.
 *
 * This lives apart from `KEY_METRICS_WIDGETS` on purpose: the tiles import the
 * dashboard widget modules for their shared report options and sub-text, and
 * those widgets import `KEY_METRICS_WIDGETS` back (through `MetricTileWrapper`).
 * Keeping the PDF configs here means the metadata module never imports a
 * component, so that cycle cannot form.
 *
 * - `TileComponent`: the `@react-pdf/renderer` component for the tile, wrapped
 *   with `lazyWithPreload` so the renderer stays out of the dashboard bundle.
 * - `getTileData( { registry, dates, signal, viewOnly } )`: resolves the report(s)
 *   the tile needs and returns the data the `TileComponent` consumes, or `null`
 *   when the report has no data.
 *
 * @since 1.186.0
 */
export const KEY_METRICS_PDF_TILES = {
	[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			// The tile ranks pages by AdSense revenue and labels them by
			// page title, so this resolves the linked account ID and the
			// ranked page paths before requesting the earnings report and
			// the matching page titles report.
			async ( rawDates, registry ) => {
				// Table tiles request a single date range; drop the export's compare dates.
				const dates = pdfTableDates( rawDates );
				// The AdSense account ID lives in AdSense settings, which
				// the export path does not otherwise resolve, so resolve
				// them before reading the ID or the ad source filter targets
				// a malformed `Google AdSense account (undefined)`.
				await registry.resolveSelect( MODULES_ADSENSE ).getSettings();

				const adSenseAccountID = registry
					.select( MODULES_ADSENSE )
					.getAccountID();

				const options = getTopEarningContentReportOptions( dates, {
					adSenseAccountID,
				} );

				// The page titles report needs the ranked page paths, so
				// resolve the earnings report first and derive its options
				// from those paths.
				const report = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( options );
				const pagePaths = getPagePaths( report );

				// No ranked pages means the report has no data, so fetch
				// nothing and let the empty reports drop the tile.
				if ( pagePaths.length === 0 ) {
					return [];
				}

				return [
					{ moduleStore: MODULES_ANALYTICS_4, options },
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions( dates, pagePaths ),
					},
				];
			},
			(
				[ earningsReport, titlesReport ],
				{ registry, dates, viewOnly }
			) => {
				const { rows = [] } = earningsReport || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				const currencyCode = earningsReport?.metadata?.currencyCode;
				const titles = getPageTitleMap(
					getPagePaths( earningsReport ),
					titlesReport
				);

				return {
					rows: mapPageRows(
						rows,
						{ registry, dates: pdfTableDates( dates ), viewOnly },
						{
							primary: ( row, pagePath ) => titles[ pagePath ],
							metric: ( row ) =>
								numFmt( row.metricValues[ 0 ].value, {
									style: 'currency',
									currency: currencyCode,
								} ),
						}
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			// The report window and its page-path filter derive from the
			// reference date, and the page titles report depends on the page
			// paths this report returns, so resolve both before requesting.
			async ( dates, registry ) => {
				const referenceDate = registry
					.select( CORE_USER )
					.getReferenceDate();
				const reportOptions =
					getTopRecentTrendingPagesReportOptions( referenceDate );

				const pagesReport = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( reportOptions );

				const requests = [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: reportOptions,
					},
				];

				// Request page titles only when there are pages to resolve
				// them for, mirroring the dashboard tile's title lookup.
				const pagePaths = getPagePaths( pagesReport );
				if ( pagePaths.length > 0 ) {
					requests.push( {
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions(
							reportOptions,
							pagePaths
						),
					} );
				}

				return requests;
			},
			( [ pagesReport, titlesReport ], { registry, viewOnly } ) => {
				const { rows = [] } = pagesReport || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				// Map each page path to its title, matching the dashboard
				// tile which shows the page title rather than the raw path.
				const titles = getPageTitleMap(
					getPagePaths( pagesReport ),
					titlesReport
				);

				// The row link must use the report's own fixed 3-day window
				// (see `buildReports` above), not the export's overall date
				// range, to match the dashboard row's own link.
				const referenceDate = registry
					.select( CORE_USER )
					.getReferenceDate();

				return {
					rows: mapPageRows(
						rows,
						{
							registry,
							dates: getDateRange( referenceDate ),
							viewOnly,
						},
						{
							primary: ( row, pagePath ) =>
								decodeAmpersand( titles[ pagePath ] ),
							metric: ( row ) =>
								numFmt( row.metricValues?.[ 0 ]?.value ),
						}
					),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_POPULAR_AUTHORS ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getPopularAuthorsReportOptions(
						pdfTableDates( dates )
					),
				},
			],
			( [ report ] ) => {
				const { rows = [] } = report || {};

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.dimensionValues[ 0 ].value,
						metric: numFmt( row.metricValues[ 0 ].value ),
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_CATEGORIES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getTopCategoriesReportOptions(
						pdfTableDates( dates )
					),
				},
			],
			( [ report ] ) => {
				const { rows = [] } = report || {};

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => {
						const categoryValue = row.dimensionValues?.[ 0 ]?.value;
						const categoriesList =
							typeof categoryValue === 'string'
								? splitCategories( categoryValue )
								: [];

						return {
							// Join the post's categories exactly like the dashboard tile.
							primary: listFormat( categoriesList.map( String ), {
								style: 'narrow',
							} ),
							metric: numFmt( row.metricValues?.[ 0 ]?.value ),
						};
					} ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_POPULAR_CONTENT ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			// The page titles report depends on the page paths in the
			// content report, so this resolves that report first and then
			// requests the titles for those paths.
			async ( rawDates, registry ) => {
				// Table tiles request a single date range; drop the export's compare dates.
				const dates = pdfTableDates( rawDates );
				const options = getPopularContentReportOptions( dates );

				const report = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( options );

				const pagePaths = getPagePaths( report );

				const requests = [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options,
					},
				];

				// Only request titles when there are page paths to resolve.
				if ( pagePaths.length > 0 ) {
					requests.push( {
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions( dates, pagePaths ),
					} );
				}

				return requests;
			},
			( [ report, titlesReport ], { registry, dates, viewOnly } ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				const pagePaths = getPagePaths( report );
				const titles = getPageTitleMap( pagePaths, titlesReport );

				return {
					// The page path maps to its title, matching the
					// dashboard tile's primary column.
					rows: mapPageRows(
						rows,
						{ registry, dates: pdfTableDates( dates ), viewOnly },
						{
							primary: ( row, pagePath ) =>
								decodeAmpersand( titles[ pagePath ] ),
							metric: ( row ) =>
								numFmt( row.metricValues[ 0 ].value ),
						}
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_POPULAR_PRODUCTS ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			// The report options depend on the detected product post
			// type, so this resolves it from the registry before
			// building the requests.
			async ( rawDates, registry ) => {
				const productPostType = await registry
					.resolveSelect( CORE_SITE )
					.getProductPostType();

				// No detected product post type means there is no
				// product data, so fetch nothing and let the tile drop.
				if ( ! productPostType ) {
					return [];
				}

				// Table tiles request a single date range; drop the
				// export's compare dates.
				const dates = pdfTableDates( rawDates );
				const options = getPopularProductsReportOptions(
					dates,
					productPostType
				);

				// Resolve the products report first so its page paths
				// drive the page titles request, matching the dashboard
				// tile's titles lookup.
				const report = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( options );
				const pagePaths = getPagePaths( report );

				// No page paths means the products report has no data,
				// so fetch nothing and let the tile drop.
				if ( pagePaths.length === 0 ) {
					return [];
				}

				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options,
					},
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions( dates, pagePaths ),
					},
				];
			},
			( [ report, titlesReport ], { registry, dates, viewOnly } ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				// Map each page path to its title, mirroring the
				// dashboard tile's page titles lookup.
				const titles = getPageTitleMap(
					getPagePaths( report ),
					titlesReport
				);

				return {
					rows: mapPageRows(
						rows,
						{ registry, dates: pdfTableDates( dates ), viewOnly },
						{
							primary: ( row, pagePath ) =>
								decodeAmpersand( titles[ pagePath ] ),
							metric: ( row ) =>
								numFmt( row.metricValues[ 0 ].value ),
						}
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_PAGES_PER_VISIT ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getPagesPerVisitReportOptions( dates ),
				},
			],
			( [ report ] ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				function findRow( dateRange ) {
					return rows.find(
						( row ) =>
							row?.dimensionValues?.[ 0 ]?.value === dateRange
					);
				}

				const current =
					Number(
						findRow( 'date_range_0' )?.metricValues?.[ 0 ]?.value
					) || 0;
				const previous =
					Number(
						findRow( 'date_range_1' )?.metricValues?.[ 0 ]?.value
					) || 0;
				const totalPageViews =
					Number(
						findRow( 'date_range_0' )?.metricValues?.[ 1 ]?.value
					) || 0;

				return {
					value: numFmt( current, {
						style: 'decimal',
						maximumFractionDigits: 2,
					} ),
					subtext: getPagesPerVisitSubtext( totalPageViews ),
					...getPDFTileChange( previous, current ),
				};
			}
		),
	},
	[ KM_ANALYTICS_VISIT_LENGTH ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getVisitLengthReportOptions( dates ),
				},
			],
			( [ report ] ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				function findRow( dateRange ) {
					return rows.find(
						( row ) =>
							row?.dimensionValues?.[ 0 ]?.value === dateRange
					);
				}

				const current =
					Number(
						findRow( 'date_range_0' )?.metricValues?.[ 0 ]?.value
					) || 0;
				const previous =
					Number(
						findRow( 'date_range_1' )?.metricValues?.[ 0 ]?.value
					) || 0;
				const totalSessions =
					Number(
						findRow( 'date_range_0' )?.metricValues?.[ 1 ]?.value
					) || 0;

				return {
					// `'s'` formats the duration, matching the dashboard tile.
					value: numFmt( current, 's' ),
					subtext: getVisitLengthSubtext( totalSessions ),
					...getPDFTileChange( previous, current ),
				};
			}
		),
	},
	[ KM_ANALYTICS_VISITS_PER_VISITOR ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getVisitsPerVisitorReportOptions( dates ),
				},
			],
			( [ report ] ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				function findRow( dateRange ) {
					return rows.find(
						( row ) =>
							row?.dimensionValues?.[ 0 ]?.value === dateRange
					);
				}

				const current =
					Number(
						findRow( 'date_range_0' )?.metricValues?.[ 0 ]?.value
					) || 0;
				const previous =
					Number(
						findRow( 'date_range_1' )?.metricValues?.[ 0 ]?.value
					) || 0;
				const totalSessions =
					Number(
						findRow( 'date_range_0' )?.metricValues?.[ 1 ]?.value
					) || 0;

				return {
					value: numFmt( current ),
					subtext: getVisitsPerVisitorSubtext( totalSessions ),
					...getPDFTileChange( previous, current ),
				};
			}
		),
	},
	[ KM_ANALYTICS_MOST_ENGAGING_PAGES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( rawDates, registry ) => {
				// Table tiles request a single date range; drop the export's compare dates.
				const dates = pdfTableDates( rawDates );
				const { pageViews } =
					getMostEngagingPagesReportOptions( dates );

				// Resolve the page views report first to derive the
				// average page views the engaging pages report filters on.
				const pageViewsReport = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( pageViews );

				const averagePageViews =
					Math.round(
						pageViewsReport?.totals?.[ 0 ]?.metricValues?.[ 0 ]
							?.value / pageViewsReport?.rowCount
					) || 0;

				const { engagingPages } = getMostEngagingPagesReportOptions(
					dates,
					averagePageViews
				);

				// Resolve the engaging pages report so its page paths can
				// drive the page titles report.
				const report = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( engagingPages );

				const pagePaths = getPagePaths( report );

				const requests = [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: engagingPages,
					},
				];

				// Request page titles only when there are page paths to
				// resolve, mirroring the dashboard tile's title lookup.
				if ( pagePaths.length > 0 ) {
					requests.push( {
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions( dates, pagePaths ),
					} );
				}

				return requests;
			},
			( [ report, titlesReport ], { registry, dates, viewOnly } ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				const titles = getPageTitleMap(
					getPagePaths( report ),
					titlesReport
				);

				return {
					rows: mapPageRows(
						rows,
						{ registry, dates: pdfTableDates( dates ), viewOnly },
						{
							primary: ( row, pagePath ) =>
								decodeAmpersand( titles[ pagePath ] ),
							metric: ( row ) =>
								numFmt(
									row.metricValues?.[ 0 ]?.value,
									TILE_PERCENT_FORMAT
								),
						}
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_LEAST_ENGAGING_PAGES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			// The ranked report filters to pages at or above the median page
			// views, and the titles report keys off that report's page paths,
			// so resolve those reports before building the requests.
			async ( rawDates, registry ) => {
				// Table tiles request a single date range; drop the export's compare dates.
				const dates = pdfTableDates( rawDates );
				const analytics = registry.resolveSelect( MODULES_ANALYTICS_4 );

				// Derive the median page views the ranked report filters
				// against, matching the dashboard's LeastEngagingPagesWidget.
				const { pageViews: pageViewsOptions } =
					getLeastEngagingPagesReportOptions( dates );
				const pageViewsReport = await analytics.getReport(
					pageViewsOptions
				);

				const medianIndex = parseInt(
					pageViewsReport?.rowCount / 2,
					10
				);
				const medianPageViews =
					parseInt(
						pageViewsReport?.rows?.[ medianIndex ]
							?.metricValues?.[ 0 ]?.value,
						10
					) || 0;

				const { report: reportOptions } =
					getLeastEngagingPagesReportOptions(
						dates,
						medianPageViews
					);

				// Collect the ranked report's page paths so the titles report
				// can resolve each path to its page title.
				const report = await analytics.getReport( reportOptions );
				const pagePaths = getPagePaths( report );

				// No pages means no data, so fetch nothing and let the empty
				// report drop the tile.
				if ( pagePaths.length === 0 ) {
					return [];
				}

				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: reportOptions,
					},
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions( dates, pagePaths ),
					},
				];
			},
			( [ report, titlesReport ], { registry, dates, viewOnly } ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				// The primary column shows the page title, not the raw path,
				// so resolve each path to its title exactly as the dashboard
				// tile does.
				const pagePaths = getPagePaths( report );
				const titles = getPageTitleMap( pagePaths, titlesReport );

				return {
					rows: mapPageRows(
						rows,
						{ registry, dates: pdfTableDates( dates ), viewOnly },
						{
							primary: ( row, pagePath ) =>
								decodeAmpersand( titles[ pagePath ] ),
							// The metric is the bounce rate, formatted as a
							// percent to match the dashboard tile.
							metric: ( row ) =>
								numFmt(
									row?.metricValues?.[ 0 ]?.value,
									TILE_PERCENT_FORMAT
								),
						}
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			// The primary label is the page title, which comes from a second
			// report keyed to the pages the first report returns, so this
			// resolves the main report before building the requests.
			async ( rawDates, registry ) => {
				// Table tiles request a single date range; drop the export's compare dates.
				const dates = pdfTableDates( rawDates );
				const options =
					getTopReturningVisitorPagesReportOptions( dates );

				const report = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( options );

				const requests = [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options,
					},
				];

				// Request the page titles only when there are pages to
				// resolve titles for.
				const pagePaths = getPagePaths( report );
				if ( pagePaths.length > 0 ) {
					requests.push( {
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions( dates, pagePaths ),
					} );
				}

				return requests;
			},
			( [ report, titlesReport ], { registry, dates, viewOnly } ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				const titles = getPageTitleMap(
					getPagePaths( report ),
					titlesReport
				);

				return {
					rows: mapPageRows(
						rows,
						{ registry, dates: pdfTableDates( dates ), viewOnly },
						{
							primary: ( row, pagePath ) =>
								decodeAmpersand( titles[ pagePath ] ),
							metric: ( row ) =>
								numFmt( row.metricValues?.[ 0 ]?.value ),
						}
					),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_NEW_VISITORS ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getNewVisitorsReportOptions( dates ),
				},
			],
			( [ report ] ) => {
				const { rows = [], totals = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				// The prominent value is the current period's new visitors,
				// matching the dashboard's NewVisitorsWidget.
				const newVisitors =
					Number(
						rows.find(
							( row ) =>
								row?.dimensionValues?.[ 0 ]?.value === 'new' &&
								row?.dimensionValues?.[ 1 ]?.value ===
									'date_range_0'
						)?.metricValues?.[ 0 ]?.value
					) || 0;

				// The change compares the current and previous total
				// visitors, again matching the dashboard tile.
				const currentValue =
					Number( totals[ 0 ]?.metricValues?.[ 0 ]?.value ) || 0;
				const previousValue =
					Number( totals[ 1 ]?.metricValues?.[ 0 ]?.value ) || 0;

				return {
					value: numFmt( newVisitors ),
					subtext: getNewVisitorsSubtext( currentValue ),
					...getPDFTileChange( previousValue, currentValue ),
				};
			}
		),
	},
	[ KM_ANALYTICS_RETURNING_VISITORS ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getReturningVisitorsReportOptions( dates ),
				},
			],
			( [ report ] ) => {
				const { rows = [], totals = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( rows.length === 0 ) {
					return null;
				}

				function findValue( dateRange ) {
					return (
						Number(
							rows.find(
								( row ) =>
									row?.dimensionValues?.[ 0 ]?.value ===
										'returning' &&
									row?.dimensionValues?.[ 1 ]?.value ===
										dateRange
							)?.metricValues?.[ 0 ]?.value
						) || 0
					);
				}

				const returning = findValue( 'date_range_0' );
				const prevReturning = findValue( 'date_range_1' );
				const total =
					Number( totals[ 0 ]?.metricValues?.[ 0 ]?.value ) || 0;
				const prevTotal =
					Number( totals[ 1 ]?.metricValues?.[ 0 ]?.value ) || 0;

				// The value is the share of returning visitors, matching the
				// dashboard's ReturningVisitorsWidget.
				const currentPercentage = total > 0 ? returning / total : 0;
				const prevPercentage =
					prevTotal > 0 ? prevReturning / prevTotal : 0;

				return {
					value: numFmt( currentPercentage, {
						style: 'percent',
						signDisplay: 'never',
						maximumFractionDigits: 1,
					} ),
					subtext: getReturningVisitorsSubtext( total ),
					// The metric is a percentage, so the badge shows the
					// absolute point change, matching the dashboard tile.
					...getPDFTileChange( prevPercentage, currentPercentage, {
						isAbsolute: true,
					} ),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE ]: {
		TileComponent: PDFMetricTileText,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => {
				const { totalUsers, trafficSource } =
					getTopTrafficSourceReportOptions( dates );
				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: totalUsers,
					},
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: trafficSource,
					},
				];
			},
			( [ totalReport, sourceReport ] ) =>
				extractTopSourceShareTile(
					totalReport,
					sourceReport,
					getTopTrafficSourceSubtext
				)
		),
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART ]: {
		TileComponent: PDFMetricTileText,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => {
				const { totalAddToCart, trafficSource } =
					getTopTrafficSourceDrivingAddToCartReportOptions( dates );
				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: totalAddToCart,
					},
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: trafficSource,
					},
				];
			},
			( [ totalReport, sourceReport ] ) =>
				extractTopSourceShareTile(
					totalReport,
					sourceReport,
					getTopTrafficSourceDrivingAddToCartSubtext
				)
		),
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS ]: {
		TileComponent: PDFMetricTileText,
		getTileData: createKeyMetricTileDataLoader(
			// The report options depend on the detected lead events, so this
			// resolves them from the registry before building the requests.
			async ( dates, registry ) => {
				const detectedEvents = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const eventNames =
					getTopTrafficSourceDrivingLeadsEventNames( detectedEvents );

				// No detected lead events means no data, so fetch nothing and
				// let the empty reports drop the tile.
				if ( eventNames.length === 0 ) {
					return [];
				}

				const { totalLeads, trafficSource } =
					getTopTrafficSourceDrivingLeadsReportOptions(
						dates,
						eventNames
					);
				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: totalLeads,
					},
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: trafficSource,
					},
				];
			},
			( [ totalReport, sourceReport ] ) => {
				const { rows: totalRows = [] } = totalReport || {};
				const { rows: sourceRows = [] } = sourceReport || {};

				// The date-range dimension shifts position with the event
				// filter, so match a row by any dimension holding the range.
				function rowFor( rows, dateRange ) {
					return rows.find( ( row ) =>
						( row?.dimensionValues || [] ).some(
							( dimension ) => dimension?.value === dateRange
						)
					);
				}

				const topSource = rowFor( sourceRows, 'date_range_0' )
					?.dimensionValues?.[ 0 ]?.value;

				// No top source row means the report has no data.
				if ( ! topSource ) {
					return null;
				}

				function rateFor( dateRange ) {
					const total =
						Number(
							rowFor( totalRows, dateRange )?.metricValues?.[ 0 ]
								?.value
						) || 0;
					const sourceValue =
						Number(
							rowFor( sourceRows, dateRange )?.metricValues?.[ 0 ]
								?.value
						) || 0;
					return total ? sourceValue / total : 0;
				}

				const currentRate = rateFor( 'date_range_0' );
				const previousRate = rateFor( 'date_range_1' );

				return {
					value: topSource,
					subtext:
						getTopTrafficSourceDrivingLeadsSubtext( currentRate ),
					...getPDFTileChange( previousRate, currentRate, {
						isAbsolute: true,
					} ),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES ]: {
		TileComponent: PDFMetricTileText,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const { totalPurchases, trafficSource } =
					getTopTrafficSourceDrivingPurchasesReportOptions( dates );

				// `ecommercePurchases` returns a zero-valued row rather than
				// no data, so the per-source report can still name a top
				// source for a period with no purchases. Confirm a purchase
				// happened before requesting it, matching the dashboard's
				// TopTrafficSourceDrivingPurchasesWidget.
				const totalReport = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( totalPurchases );

				const hasPurchases = ( totalReport?.rows || [] ).some(
					( row ) => Number( row?.metricValues?.[ 0 ]?.value ) > 0
				);

				if ( ! hasPurchases ) {
					return [];
				}

				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: totalPurchases,
					},
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: trafficSource,
					},
				];
			},
			( [ totalReport, sourceReport ] ) =>
				extractTopSourceShareTile(
					totalReport,
					sourceReport,
					getTopTrafficSourceDrivingPurchasesSubtext
				)
		),
	},
	[ KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE ]: {
		TileComponent: PDFMetricTileText,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getEngagedTrafficSourceReportOptions( dates ),
				},
			],
			( [ report ] ) => {
				const { rows = [], totals = [] } = report || {};

				function rowFor( collection, dateRange ) {
					return collection.find(
						( row ) =>
							row?.dimensionValues?.[ 1 ]?.value === dateRange
					);
				}

				const topSource = rowFor( rows, 'date_range_0' )
					?.dimensionValues?.[ 0 ]?.value;

				// No top source row means the report has no data.
				if ( ! topSource ) {
					return null;
				}

				function rateFor( dateRange ) {
					const engaged =
						Number(
							rowFor( rows, dateRange )?.metricValues?.[ 0 ]
								?.value
						) || 0;
					const total =
						Number(
							rowFor( totals, dateRange )?.metricValues?.[ 0 ]
								?.value
						) || 0;
					return total ? engaged / total : 0;
				}

				const currentRate = rateFor( 'date_range_0' );
				const previousRate = rateFor( 'date_range_1' );
				const currentTotal =
					Number(
						rowFor( totals, 'date_range_0' )?.metricValues?.[ 0 ]
							?.value
					) || 0;

				return {
					value: topSource,
					subtext: getEngagedTrafficSourceSubtext(
						currentRate,
						currentTotal
					),
					...getPDFTileChange( previousRate, currentRate, {
						isAbsolute: true,
					} ),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE ]: {
		TileComponent: PDFMetricTileText,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options:
						getTopConvertingTrafficSourceReportOptions( dates ),
				},
			],
			( [ report ] ) => {
				const { rows = [] } = report || {};

				function rowFor( dateRange ) {
					return rows.find(
						( row ) =>
							row?.dimensionValues?.[ 1 ]?.value === dateRange
					);
				}

				const currentRow = rowFor( 'date_range_0' );
				const topChannel = currentRow?.dimensionValues?.[ 0 ]?.value;

				// No top channel row means the report has no data.
				if ( ! topChannel ) {
					return null;
				}

				// The metric is already the key-event rate for the channel.
				const currentRate =
					Number( currentRow?.metricValues?.[ 0 ]?.value ) || 0;
				const previousRate =
					Number(
						rowFor( 'date_range_1' )?.metricValues?.[ 0 ]?.value
					) || 0;

				return {
					value: topChannel,
					subtext:
						getTopConvertingTrafficSourceSubtext( currentRate ),
					...getPDFTileChange( previousRate, currentRate, {
						isAbsolute: true,
					} ),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_CITIES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getTopCitiesReportOptions(
						pdfTableDates( dates )
					),
				},
			],
			( [ report ] ) => {
				// Mirror the dashboard tile: drop "(not set)"/empty cities and cap at the top three, showing each city's share of total users.
				const { rows = [], totals = [] } = report || {};
				// Coerce the total and guard the division, so a missing or zero
				// total yields 0% rather than NaN% or ∞%, as the Top Countries
				// tile does.
				const totalUsers =
					Number( totals[ 0 ]?.metricValues?.[ 0 ]?.value ) || 0;
				const tileRows = reportRowsWithSetValues( rows ).map(
					( row ) => ( {
						primary: row.dimensionValues[ 0 ].value,
						metric: numFmt(
							totalUsers
								? Number( row.metricValues[ 0 ].value ) /
										totalUsers
								: 0,
							TILE_PERCENT_FORMAT
						),
					} )
				);
				if ( ! tileRows.length ) {
					return null;
				}
				return { rows: tileRows };
			}
		),
	},
	[ KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			// The report options depend on the detected lead events, so this
			// resolves them from the registry before building the request.
			async ( rawDates, registry ) => {
				const detectedEvents = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const eventNames =
					getTopCitiesDrivingLeadsEventNames( detectedEvents );

				// No detected lead events means no data, so fetch nothing and
				// let the empty report drop the tile.
				if ( eventNames.length === 0 ) {
					return [];
				}

				// Table tiles request a single date range; drop the
				// export's compare dates.
				const dates = pdfTableDates( rawDates );
				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: getTopCitiesDrivingLeadsReportOptions(
							dates,
							eventNames
						),
					},
				];
			},
			( [ citiesReport ] ) => {
				const { rows = [] } = citiesReport || {};

				// No rows means the report has no data.
				if ( rows.length === 0 ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.dimensionValues[ 0 ].value,
						metric: numFmt( row.metricValues[ 0 ].value ),
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getTopCitiesDrivingAddToCartReportOptions(
						pdfTableDates( dates )
					),
				},
			],
			( [ report ] ) => {
				const { rows = [] } = report || {};

				// The report is already ordered by add to carts and capped at
				// three rows, so map the cities straight through in that order.
				const tileRows = rows
					.filter( ( row ) => row?.dimensionValues?.[ 0 ]?.value )
					.map( ( row ) => ( {
						primary: row.dimensionValues[ 0 ].value,
						metric: numFmt( row.metricValues?.[ 0 ]?.value ),
					} ) );

				// No city rows means the report has no data.
				if ( tileRows.length === 0 ) {
					return null;
				}

				return { rows: tileRows };
			}
		),
	},
	[ KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getTopCitiesDrivingPurchasesReportOptions(
						pdfTableDates( dates )
					),
				},
			],
			( [ report ] ) => {
				const { rows = [] } = report || {};

				// No rows means the report has no data, so drop the tile.
				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.dimensionValues[ 0 ].value,
						metric: numFmt( row.metricValues[ 0 ].value ),
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES ]: {
		TileComponent: PDFMetricTileText,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const { totalPurchases, device } =
					getTopDeviceDrivingPurchasesReportOptions( dates );

				// `ecommercePurchases` returns a zero-valued row rather than
				// no data, so the per-device report can still name a top
				// device for a period with no purchases. Confirm a purchase
				// happened before requesting it, matching the dashboard's
				// TopDeviceDrivingPurchasesWidget.
				const totalReport = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( totalPurchases );

				const hasPurchases = ( totalReport?.rows || [] ).some(
					( row ) => Number( row?.metricValues?.[ 0 ]?.value ) > 0
				);

				if ( ! hasPurchases ) {
					return [];
				}

				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: totalPurchases,
					},
					{ moduleStore: MODULES_ANALYTICS_4, options: device },
				];
			},
			( [ totalReport, deviceReport ] ) =>
				extractTopSourceShareTile(
					totalReport,
					deviceReport,
					getTopDeviceDrivingPurchasesSubtext
				)
		),
	},
	[ KM_ANALYTICS_TOP_COUNTRIES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_ANALYTICS_4,
					options: getTopCountriesReportOptions(
						pdfTableDates( dates )
					),
				},
			],
			( [ report ] ) => {
				const { rows = [], totals = [] } = report || {};
				const totalUsers =
					Number( totals[ 0 ]?.metricValues?.[ 0 ]?.value ) || 0;

				// Drop the "(not set)" and empty country rows the dashboard tile hides.
				const namedRows = rows.filter(
					( row ) =>
						row?.dimensionValues?.[ 0 ]?.value !== '(not set)' &&
						row?.dimensionValues?.[ 0 ]?.value !== ''
				);

				// No named country rows means the report has no data, so drop the tile.
				if ( ! namedRows.length ) {
					return null;
				}

				return {
					rows: namedRows.map( ( row ) => ( {
						primary: row.dimensionValues[ 0 ].value,
						metric: numFmt(
							totalUsers
								? Number( row.metricValues[ 0 ].value ) /
										totalUsers
								: 0,
							TILE_PERCENT_FORMAT
						),
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			( dates ) => [
				{
					moduleStore: MODULES_SEARCH_CONSOLE,
					options: getPopularKeywordsReportOptions(
						pdfTableDates( dates )
					),
				},
			],
			( [ report ], { registry, dates, viewOnly } ) => {
				const limit = 3;

				// The Search Console report requests up to 100 rows for the
				// client-side CTR sort (matching PopularKeywordsWidget), so
				// slice to the displayed limit before building each row's
				// link — building a URL for every fetched row here would
				// waste dozens of unused Search Console URL builds per
				// export.
				const rows = [ ...( report || [] ) ]
					.sort(
						( { ctr: ctrA = 0 }, { ctr: ctrB = 0 } ) => ctrB - ctrA
					)
					.slice( 0, limit );

				if ( ! rows.length ) {
					return null;
				}

				const getServiceReportURL = registry.select(
					MODULES_SEARCH_CONSOLE
				).getServiceReportURL;
				const singleDates = pdfTableDates( dates );

				return {
					rows: rows.map( ( row ) => {
						const keyword = row.keys[ 0 ];
						return {
							primary: keyword,
							// Matches PopularKeywordsWidget's own row link.
							primaryURL: getPopularKeywordReportURL( {
								getServiceReportURL,
								dates: singleDates,
								keyword,
								viewOnly,
							} ),
							metric: sprintf(
								/* translators: %s: clickthrough rate value. */
								__( '%s CTR', 'google-site-kit' ),
								numFmt( row.ctr, '%' )
							),
						};
					} ),
					limit,
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			// The report options depend on the detected lead events, so this
			// resolves them from the registry before building the requests.
			async ( dates, registry ) => {
				const detectedEvents = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const eventNames =
					getTopPagesDrivingLeadsEventNames( detectedEvents );

				// No detected lead events means no data, so fetch nothing and
				// let the empty reports drop the tile.
				if ( eventNames.length === 0 ) {
					return [];
				}

				// The dashboard tile shows a single period, so request the
				// ranked report without the comparison range.
				const options = getTopPagesDrivingLeadsReportOptions(
					pdfTableDates( dates ),
					eventNames
				);

				// The page titles come from a second report keyed off the
				// ranked report's pages, so resolve that report to read its
				// page paths before requesting them.
				const report = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( options );
				const pagePaths = getPagePaths( report );

				const requests = [
					{ moduleStore: MODULES_ANALYTICS_4, options },
				];

				if ( pagePaths.length > 0 ) {
					requests.push( {
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions(
							pdfTableDates( dates ),
							pagePaths
						),
					} );
				}

				return requests;
			},
			( [ report, titlesReport ], { registry, dates, viewOnly } ) => {
				const { rows = [] } = report || {};

				// No ranked rows means the report has no data.
				if ( rows.length === 0 ) {
					return null;
				}

				// Match each page path to its title, mirroring the dashboard
				// tile which shows the page title rather than the raw path.
				const titles = getPageTitleMap(
					getPagePaths( report ),
					titlesReport
				);

				return {
					rows: mapPageRows(
						rows,
						{ registry, dates: pdfTableDates( dates ), viewOnly },
						{
							primary: ( row, pagePath ) =>
								decodeAmpersand( titles[ pagePath ] ),
							metric: ( row ) =>
								numFmt( row.metricValues?.[ 0 ]?.value ),
						}
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOTAL_SALES ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const primaryEvent = await resolvePrimaryEcommerceEvent(
					registry
				);
				const options = buildPrimaryEventReportOptions(
					dates,
					primaryEvent
				);

				// No primary ecommerce event means no data, so fetch nothing
				// and let the empty reports drop the tile.
				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const { currentPrimaryCount, previousPrimaryCount } =
					processReports( report || {}, {} );

				// No rows means the report has no data, so drop the tile.
				if ( ! report?.rows?.length ) {
					return null;
				}

				return {
					value: numFmt( currentPrimaryCount, {
						style: 'decimal',
					} ),
					...getPDFTileChange(
						previousPrimaryCount,
						currentPrimaryCount
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_SALES_RATE ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const primaryEvent = await resolvePrimaryEcommerceEvent(
					registry
				);
				const primaryEventOptions = buildPrimaryEventReportOptions(
					dates,
					primaryEvent
				);

				// No primary ecommerce event means no data, so fetch nothing
				// and let the empty reports drop the tile.
				if ( ! primaryEventOptions ) {
					return [];
				}

				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: primaryEventOptions,
					},
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: buildEngagementReportOptions( dates ),
					},
				];
			},
			( [ primaryEventReport, engagementReport ] ) => {
				const { currentRate, previousRate, currentSessions } =
					processReports(
						primaryEventReport || {},
						engagementReport || {}
					);

				// No rows means the report has no data, so drop the tile.
				if ( ! primaryEventReport?.rows?.length ) {
					return null;
				}

				return {
					value: numFmt( currentRate, TILE_PERCENT_FORMAT ),
					subtext: sprintf(
						/* translators: %s: formatted number of total sessions */
						__( 'of %s total sessions', 'google-site-kit' ),
						numFmt( currentSessions, { style: 'decimal' } )
					),
					// The metric is a percentage, so the badge shows the
					// absolute point change, matching the dashboard tile.
					...getPDFTileChange( previousRate, currentRate, {
						isAbsolute: true,
					} ),
				};
			}
		),
	},
	[ KM_ANALYTICS_SALES_ENGAGEMENT_RATE ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const primaryEvent = await resolvePrimaryEcommerceEvent(
					registry
				);

				// No primary ecommerce event means no data, so fetch nothing
				// and let the empty reports drop the tile.
				if ( ! primaryEvent ) {
					return [];
				}

				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: buildEngagementReportOptions( dates ),
					},
				];
			},
			( [ engagementReport ] ) => {
				const {
					currentEngagementRate,
					previousEngagementRate,
					currentSessions,
				} = processReports( {}, engagementReport || {} );

				// No totals means the report has no data, so drop the tile.
				if ( ! engagementReport?.totals?.length ) {
					return null;
				}

				return {
					value: numFmt( currentEngagementRate, TILE_PERCENT_FORMAT ),
					subtext: sprintf(
						/* translators: %s: formatted number of total sessions */
						__( 'of %s total sessions', 'google-site-kit' ),
						numFmt( currentSessions, { style: 'decimal' } )
					),
					// The metric is a percentage, so the badge shows the
					// absolute point change, matching the dashboard tile.
					...getPDFTileChange(
						previousEngagementRate,
						currentEngagementRate,
						{ isAbsolute: true }
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const primaryEvent = await resolvePrimaryEcommerceEvent(
					registry
				);
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_SALES_BY_VISITOR_TYPE ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const primaryEvent = await resolvePrimaryEcommerceEvent(
					registry
				);
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.VISITOR_TYPE
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.VISITOR_TYPE
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_SALES_BY_COUNTRIES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const primaryEvent = await resolvePrimaryEcommerceEvent(
					registry
				);
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.COUNTRIES
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.COUNTRIES
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const primaryEvent = await resolvePrimaryEcommerceEvent(
					registry
				);
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.TOP_AUTHORS
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.TOP_AUTHORS
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_PAGES_DRIVING_SALES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				const primaryEvent = await resolvePrimaryEcommerceEvent(
					registry
				);
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.TOP_PAGES
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				// The page titles come from a second report keyed off the
				// ranked report's pages, so resolve that report to read its
				// page paths before requesting them.
				const report = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( options );
				const pagePaths = getPagePaths( report );

				const requests = [
					{ moduleStore: MODULES_ANALYTICS_4, options },
				];

				if ( pagePaths.length > 0 ) {
					requests.push( {
						moduleStore: MODULES_ANALYTICS_4,
						options: getPageTitlesReportOptions(
							pdfTableDates( dates ),
							pagePaths
						),
					} );
				}

				return requests;
			},
			( [ report, titlesReport ], { registry, dates, viewOnly } ) => {
				const { rows = [] } = report || {};

				// No ranked rows means the report has no data.
				if ( rows.length === 0 ) {
					return null;
				}

				// Match each page path to its title, mirroring the dashboard
				// tile which shows the page title rather than the raw path.
				const titles = getPageTitleMap(
					getPagePaths( report ),
					titlesReport
				);

				return {
					rows: mapPageRows(
						rows,
						{ registry, dates: pdfTableDates( dates ), viewOnly },
						{
							primary: ( row, pagePath ) =>
								decodeAmpersand( titles[ pagePath ] ),
							metric: ( row ) =>
								numFmt( row.metricValues?.[ 0 ]?.value ),
						}
					),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_TOTAL_FORM_COMPLETIONS ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				// `getDetectedLeadEvents` derives from `getDetectedEvents` but
				// has no resolver of its own, so resolve the detected events
				// first and read the derived value once they're in.
				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const detectedLeadEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getDetectedLeadEvents();
				const options = buildPrimaryEventReportOptions(
					dates,
					detectedLeadEvents
				);

				// No detected lead events means no data, so fetch nothing and
				// let the empty reports drop the tile.
				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const { currentPrimaryCount, previousPrimaryCount } =
					processReports( report || {}, {} );

				// No rows means the report has no data, so drop the tile.
				if ( ! report?.rows?.length ) {
					return null;
				}

				return {
					value: numFmt( currentPrimaryCount, {
						style: 'decimal',
					} ),
					...getPDFTileChange(
						previousPrimaryCount,
						currentPrimaryCount
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_FORM_COMPLETION_RATE ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				// `getDetectedLeadEvents` derives from `getDetectedEvents` but
				// has no resolver of its own, so resolve the detected events
				// first and read the derived value once they're in.
				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const detectedLeadEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getDetectedLeadEvents();
				const primaryEventOptions = buildPrimaryEventReportOptions(
					dates,
					detectedLeadEvents
				);

				// No detected lead events means no data, so fetch nothing and
				// let the empty reports drop the tile.
				if ( ! primaryEventOptions ) {
					return [];
				}

				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: primaryEventOptions,
					},
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: buildEngagementReportOptions( dates ),
					},
				];
			},
			( [ primaryEventReport, engagementReport ] ) => {
				const { currentRate, previousRate, currentSessions } =
					processReports(
						primaryEventReport || {},
						engagementReport || {}
					);

				// No rows means the report has no data, so drop the tile.
				if ( ! primaryEventReport?.rows?.length ) {
					return null;
				}

				return {
					value: numFmt( currentRate, TILE_PERCENT_FORMAT ),
					subtext: sprintf(
						/* translators: %s: formatted number of total sessions */
						__( 'of %s total sessions', 'google-site-kit' ),
						numFmt( currentSessions, { style: 'decimal' } )
					),
					// The metric is a percentage, so the badge shows the
					// absolute point change, matching the dashboard tile.
					...getPDFTileChange( previousRate, currentRate, {
						isAbsolute: true,
					} ),
				};
			}
		),
	},
	[ KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE ]: {
		TileComponent: PDFNumericMetricTile,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				// `getDetectedLeadEvents` derives from `getDetectedEvents` but
				// has no resolver of its own, so resolve the detected events
				// first and read the derived value once they're in.
				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const detectedLeadEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getDetectedLeadEvents();

				// No detected lead events means no data, so fetch nothing and
				// let the empty reports drop the tile.
				if ( ! detectedLeadEvents?.length ) {
					return [];
				}

				return [
					{
						moduleStore: MODULES_ANALYTICS_4,
						options: buildEngagementReportOptions( dates ),
					},
				];
			},
			( [ engagementReport ] ) => {
				const {
					currentEngagementRate,
					previousEngagementRate,
					currentSessions,
				} = processReports( {}, engagementReport || {} );

				// No totals means the report has no data, so drop the tile.
				if ( ! engagementReport?.totals?.length ) {
					return null;
				}

				return {
					value: numFmt( currentEngagementRate, TILE_PERCENT_FORMAT ),
					subtext: sprintf(
						/* translators: %s: formatted number of total sessions */
						__( 'of %s total sessions', 'google-site-kit' ),
						numFmt( currentSessions, { style: 'decimal' } )
					),
					// The metric is a percentage, so the badge shows the
					// absolute point change, matching the dashboard tile.
					...getPDFTileChange(
						previousEngagementRate,
						currentEngagementRate,
						{ isAbsolute: true }
					),
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_FORM_COMPLETION_RATE ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				// `getDetectedLeadEvents` derives from `getDetectedEvents` but
				// has no resolver of its own, so resolve the detected events
				// first and read the derived value once they're in.
				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const detectedLeadEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getDetectedLeadEvents();
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent: detectedLeadEvents,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_LEADS_BY_VISITOR_TYPE ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				// `getDetectedLeadEvents` derives from `getDetectedEvents` but
				// has no resolver of its own, so resolve the detected events
				// first and read the derived value once they're in.
				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const detectedLeadEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getDetectedLeadEvents();
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.VISITOR_TYPE
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent: detectedLeadEvents,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.VISITOR_TYPE
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_LEADS_BY_COUNTRIES ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				// `getDetectedLeadEvents` derives from `getDetectedEvents` but
				// has no resolver of its own, so resolve the detected events
				// first and read the derived value once they're in.
				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const detectedLeadEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getDetectedLeadEvents();
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.COUNTRIES
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent: detectedLeadEvents,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.COUNTRIES
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_LEADS_BY_DEVICE_TYPE ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				// `getDetectedLeadEvents` derives from `getDetectedEvents` but
				// has no resolver of its own, so resolve the detected events
				// first and read the derived value once they're in.
				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const detectedLeadEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getDetectedLeadEvents();
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.DEVICE_TYPE
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent: detectedLeadEvents,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.DEVICE_TYPE
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
	[ KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS ]: {
		TileComponent: PDFMetricTileTable,
		getTileData: createKeyMetricTileDataLoader(
			async ( dates, registry ) => {
				// `getDetectedLeadEvents` derives from `getDetectedEvents` but
				// has no resolver of its own, so resolve the detected events
				// first and read the derived value once they're in.
				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getDetectedEvents();
				const detectedLeadEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getDetectedLeadEvents();
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					GOAL_DRIVER_IDS.TOP_AUTHORS
				]( {
					dates: pdfTableDates( dates ),
					primaryEvent: detectedLeadEvents,
					limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
				} );

				if ( ! options ) {
					return [];
				}

				return [ { moduleStore: MODULES_ANALYTICS_4, options } ];
			},
			( [ report ] ) => {
				const rows = GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.TOP_AUTHORS
				]( report?.rows || [] );

				if ( ! rows.length ) {
					return null;
				}

				return {
					rows: rows.map( ( row ) => ( {
						primary: row.label,
						metric: row.value,
					} ) ),
					limit: 3,
				};
			}
		),
	},
};
