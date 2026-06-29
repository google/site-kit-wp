/**
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
 * External dependencies
 */
import { identity } from 'lodash';

/**
 * WordPress dependencies
 */
import type { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ensureGoogleChartsLoaded from '@/js/components/pdf-export/ensure-google-charts-loaded';
import renderGoogleChartToDataURI, {
	getVisualization,
} from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import type { Report } from '@/js/modules/analytics-4/datastore/types';
import { extractAnalytics4DashboardData } from '@/js/modules/analytics-4/utils';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import {
	extractSearchConsoleDashboardData,
	getSiteStatsDataForGoogleChart,
} from '@/js/modules/search-console/util';
import { numFmt } from '@/js/util';
import { partitionReport } from '@/js/util/partition-report';
import { getDatapointAndChange } from './Overview/utils';
import {
	Analytics4ReportOptions,
	SearchConsoleReportOptions,
	getGA4KeyEventsOverviewReportOptions,
	getGA4KeyEventsReportOptions,
	getGA4VisitorsReportOptions,
	getSearchConsoleReportOptions,
} from './reportOptions';

// Per-metric line colors matching the dashboard's Search Funnel widget.
const IMPRESSIONS_COLOR = '#6380b8';
const CLICKS_COLOR = '#4bbbbb';
const UNIQUE_VISITORS_COLOR = '#3c7251';
const KEY_EVENTS_COLOR = '#8e68cb';

const LINE_CHART_WIDTH = 240;
const LINE_CHART_HEIGHT = 120;
// The chart renders to an image. A higher render scale keeps the line sharp at
// the display size. The option sizes below (line width, fonts, margins) are in
// render pixels, so scale them by the same factor to keep the proportions.
const LINE_CHART_SCALE_FACTOR = 4;
const LINE_CHART_OPTION_SCALE = LINE_CHART_SCALE_FACTOR / 2;

type Registry = WPDataRegistry & {
	// `resolveSelect` exists on the runtime registry but is absent from the
	// `@wordpress/data` registry types; alias it to the same loose shape as
	// `select` until those upstream types include it.
	resolveSelect: WPDataRegistry[ 'select' ];
};

/**
 * A single row of Google Charts data.
 *
 * Rows have various types of content: a leading `Date` for the day
 * column followed by the metric numbers and tooltip strings the
 * dashboard's charts produce.
 */
type ChartRow = Array< Date | number | string | null >;

// The chart/report utilities below are still untyped JS modules whose JSDoc
// types are looser than their runtime contracts. We alias each to the shape
// this loader relies on so the rest of the file stays type-checked. Their
// `report` inputs are typed `unknown` because we don't yet have a shared
// Search Console report type; the per-value format callbacks stay `any` because
// their inputs genuinely vary per metric. Replace these aliases with the real
// types once the underlying modules are migrated to TypeScript.
const partitionReportRows = partitionReport as unknown as (
	report: unknown,
	options: { dateRangeLength: number }
) => { compareRange: ChartRow[]; currentRange: ChartRow[] };

const getSearchConsoleChartData = getSiteStatsDataForGoogleChart as unknown as (
	current: ChartRow[],
	previous: ChartRow[],
	label: string,
	selectedColumn: string,
	dateRangeLength: number
) => ChartRow[];

const getAnalyticsChartData = extractAnalytics4DashboardData as unknown as (
	report: unknown,
	selectedStats: number,
	days: number,
	referenceDate: string,
	dataLabels: string[],
	tooltipDataFormats: Array< ( value: number ) => string >,
	chartDataFormats: Array< ( value: number ) => number >
) => ChartRow[];

const getMetricDatapointAndChange = getDatapointAndChange as unknown as (
	report: unknown,
	selectedStat: number
) => { datapoint: number; change: number | null };

export interface GetPDFDataParams {
	registry: Registry;
	dates: {
		startDate: string;
		endDate: string;
		compareStartDate: string;
		compareEndDate: string;
	};
	signal: AbortSignal;
}

export interface SearchFunnelMetric {
	/** Total for the current period. */
	total: number;
	/** Period-over-period change ratio, or `null` when it cannot be computed. */
	change: number | null;
}

export interface SearchFunnelPDFData {
	data: {
		dateRangeLength: number;
		metrics: {
			impressions: SearchFunnelMetric | null;
			clicks: SearchFunnelMetric | null;
			uniqueVisitors: SearchFunnelMetric | null;
			keyEvents: SearchFunnelMetric | null;
		};
	} | null;
	chartImages?: {
		impressions: string | null;
		clicks: string | null;
		uniqueVisitors: string | null;
		keyEvents: string | null;
	};
}

interface MetricCardResult {
	metric: SearchFunnelMetric | null;
	chartImage: string | null;
}

/**
 * Builds Google Charts options matching the dashboard's Search Funnel line
 * charts.
 *
 * The current period draws as a solid smoothed line and the previous period as a
 * dotted line of the same color, mirroring the dashboard.
 *
 * @since n.e.x.t
 *
 * @param {Object}  options         Options.
 * @param {string}  options.color   Series color for both lines.
 * @param {Array}   options.ticks   Date ticks for the horizontal axis.
 * @param {boolean} options.hasData Whether any data point is greater than zero.
 * @return {Object} Google Charts options object.
 */
function getLineChartOptions( {
	color,
	ticks,
	hasData,
}: {
	color: string;
	ticks: Date[];
	hasData: boolean;
} ): object {
	return {
		curveType: 'function',
		colors: [ color ],
		chartArea: {
			left: 32 * LINE_CHART_OPTION_SCALE,
			right: 16 * LINE_CHART_OPTION_SCALE,
			top: 12 * LINE_CHART_OPTION_SCALE,
			bottom: 22 * LINE_CHART_OPTION_SCALE,
		},
		legend: {
			position: 'none',
		},
		hAxis: {
			format: 'MMM d',
			gridlines: {
				color: '#ffffff',
			},
			textStyle: {
				color: '#6c726e',
				fontSize: 10 * LINE_CHART_OPTION_SCALE,
			},
			ticks,
		},
		vAxis: {
			gridlines: {
				color: '#ebeef0',
			},
			minorGridlines: {
				color: '#ffffff',
			},
			textStyle: {
				color: '#6c726e',
				fontSize: 10 * LINE_CHART_OPTION_SCALE,
			},
			viewWindow: {
				min: 0,
				// Cap the empty-data axis so a flat zero line still reads well.
				...( hasData ? {} : { max: 1 } ),
			},
		},
		series: {
			0: {
				color,
				lineWidth: 2 * LINE_CHART_OPTION_SCALE,
				targetAxisIndex: 0,
			},
			1: {
				color,
				lineWidth: 1 * LINE_CHART_OPTION_SCALE,
				lineDashStyle: [
					3 * LINE_CHART_OPTION_SCALE,
					3 * LINE_CHART_OPTION_SCALE,
				],
				targetAxisIndex: 0,
			},
		},
		focusTarget: 'category',
	};
}

/**
 * Builds the Google Charts `DataTable` for a metric's current/previous line chart.
 *
 * Accepts the dashboard's chart-data rows (a date, a tooltip, the current value
 * and the previous value) and keeps only the columns the PDF chart needs.
 *
 * @since n.e.x.t
 *
 * @param {Array}  dataRows     Chart data rows (without the header row).
 * @param {string} currentLabel Column label for the current-period series.
 * @return {Object} A `google.visualization.DataTable` instance.
 */
function buildChartDataTable(
	dataRows: ChartRow[],
	currentLabel: string
): object {
	const visualization = getVisualization();
	if ( ! visualization?.DataTable ) {
		throw new Error(
			'Site Kit: Google Charts DataTable is unavailable after loading the library.'
		);
	}

	const dataTable = new visualization.DataTable();
	dataTable.addColumn( 'date', __( 'Day', 'google-site-kit' ) );
	dataTable.addColumn( 'number', currentLabel );
	dataTable.addColumn( 'number', __( 'Previous period', 'google-site-kit' ) );
	dataTable.addRows(
		dataRows.map( ( row ) => [
			row[ 0 ],
			Number( row[ 2 ] ) || 0,
			Number( row[ 3 ] ) || 0,
		] )
	);

	return dataTable;
}

/**
 * Rasterises a metric's current/previous line chart to a JPEG data URI.
 *
 * @since n.e.x.t
 *
 * @param {Object}      options              Options.
 * @param {Array}       options.dataRows     Chart data rows (without the header row).
 * @param {string}      options.currentLabel Column label for the current-period series.
 * @param {string}      options.color        Series color for both lines.
 * @param {AbortSignal} options.signal       Cancellation signal.
 * @return {Promise<string>} The rendered chart image as a data URI.
 */
function rasterizeChart( {
	dataRows,
	currentLabel,
	color,
	signal,
}: {
	dataRows: ChartRow[];
	currentLabel: string;
	color: string;
	signal: AbortSignal;
} ): Promise< string > {
	// A tick per day, dropping the first so a tick sits at the range start,
	// matching the dashboard's Search Funnel charts. The leading column is always
	// the day `Date`.
	const [ , ...ticks ] = dataRows.map( ( row ) => row[ 0 ] as Date );
	const hasData = dataRows.some(
		( row ) => Number( row[ 2 ] ) > 0 || Number( row[ 3 ] ) > 0
	);

	return renderGoogleChartToDataURI( {
		chartType: 'LineChart',
		dataTable: buildChartDataTable( dataRows, currentLabel ),
		options: getLineChartOptions( { color, ticks, hasData } ),
		width: LINE_CHART_WIDTH,
		height: LINE_CHART_HEIGHT,
		scaleFactor: LINE_CHART_SCALE_FACTOR,
		signal,
	} );
}

/**
 * Resolves a report and reads its resolved value plus any selector error.
 *
 * @since n.e.x.t
 *
 * @param {Object}      registry  WordPress data registry.
 * @param {string}      storeName Datastore name to query.
 * @param {Object}      args      Report args.
 * @param {AbortSignal} signal    Cancellation signal.
 * @return {Promise<Object>} The resolved report and any error.
 */
async function resolveReport< T = unknown >(
	registry: Registry,
	storeName: string,
	args: SearchConsoleReportOptions | Analytics4ReportOptions,
	signal: AbortSignal
): Promise< { report: T | undefined; error: unknown } > {
	await registry.resolveSelect( storeName ).getReport( args, { signal } );

	return {
		report: registry.select( storeName ).getReport( args ),
		error: registry
			.select( storeName )
			.getErrorForSelector( 'getReport', [ args ] ),
	};
}

/**
 * Builds a Search Console metric card (total, delta and rasterised chart).
 *
 * Failures are isolated to the card: the returned `metric` and `chartImage` are
 * both `null` so the component can render a per-card "Data unavailable" placeholder.
 *
 * @since n.e.x.t
 *
 * @param {Object}      options                 Options for building the card.
 * @param {Object}      options.report          Resolved Search Console report.
 * @param {Object}      options.reportError     Selector error for the report, if any.
 * @param {string}      options.metricKey       Which metric the card represents.
 * @param {string}      options.currentLabel    Current-period series label.
 * @param {string}      options.color           Series color for the chart.
 * @param {number}      options.dateRangeLength Number of days in the date range.
 * @param {AbortSignal} options.signal          Cancellation signal.
 * @return {Promise<Object>} The metric card result.
 */
async function buildSearchConsoleCard( {
	report,
	reportError,
	metricKey,
	currentLabel,
	color,
	dateRangeLength,
	signal,
}: {
	// The Search Console report has no shared type yet, so it is `unknown` and
	// narrowed via `Array.isArray` below; adjust this type once that store is
	// typed.
	report: unknown;
	reportError: unknown;
	metricKey: 'impressions' | 'clicks';
	currentLabel: string;
	color: string;
	dateRangeLength: number;
	signal: AbortSignal;
} ): Promise< MetricCardResult > {
	try {
		if ( reportError || ! Array.isArray( report ) ) {
			throw new Error( 'Site Kit: Search Console report unavailable.' );
		}

		const {
			totalImpressions,
			totalClicks,
			totalImpressionsChange,
			totalClicksChange,
		} = extractSearchConsoleDashboardData( report, dateRangeLength );

		const total =
			metricKey === 'impressions' ? totalImpressions : totalClicks;
		const change =
			metricKey === 'impressions'
				? totalImpressionsChange
				: totalClicksChange;

		const { compareRange, currentRange } = partitionReportRows( report, {
			dateRangeLength,
		} );
		const chartData = getSearchConsoleChartData(
			currentRange,
			compareRange,
			currentLabel,
			metricKey,
			dateRangeLength
		);

		const chartImage = await rasterizeChart( {
			dataRows: chartData.slice( 1 ),
			currentLabel,
			color,
			signal,
		} );

		return { metric: { total, change }, chartImage };
	} catch {
		return { metric: null, chartImage: null };
	}
}

/**
 * Builds an Analytics 4 metric card (total, delta and rasterised chart).
 *
 * Failures are isolated to the card: the returned `metric` and `chartImage` are
 * both `null` so the component can render a per-card "Data unavailable" placeholder.
 *
 * @since n.e.x.t
 *
 * @param {Object}      options                    Options for building the card.
 * @param {Object}      options.statsReport        Resolved date-series report.
 * @param {Object}      options.statsError         Selector error for the series report, if any.
 * @param {Object}      options.totalsReport       Resolved totals report.
 * @param {Object}      options.totalsError        Selector error for the totals report, if any.
 * @param {string}      options.currentLabel       Current-period series label.
 * @param {Array}       options.dataLabels         Data labels passed to the extractor.
 * @param {Array}       options.tooltipDataFormats Tooltip formatters passed to the extractor.
 * @param {Array}       options.chartDataFormats   Chart value formatters passed to the extractor.
 * @param {string}      options.color              Series color for the chart.
 * @param {number}      options.dateRangeLength    Number of days in the date range.
 * @param {string}      options.referenceDate      Reference date for padding empty series.
 * @param {AbortSignal} options.signal             Cancellation signal.
 * @return {Promise<Object>} The metric card result.
 */
async function buildAnalyticsCard( {
	statsReport,
	statsError,
	totalsReport,
	totalsError,
	currentLabel,
	dataLabels,
	tooltipDataFormats,
	chartDataFormats,
	color,
	dateRangeLength,
	referenceDate,
	signal,
}: {
	statsReport: Report | undefined;
	statsError: unknown;
	totalsReport: Report | undefined;
	totalsError: unknown;
	currentLabel: string;
	dataLabels: string[];
	tooltipDataFormats: Array< ( value: number | string ) => string >;
	chartDataFormats: Array< ( value: number ) => number >;
	color: string;
	dateRangeLength: number;
	referenceDate: string;
	signal: AbortSignal;
} ): Promise< MetricCardResult > {
	// The Key Events report exposes its metric in the first column; the Unique
	// Visitors report uses a single metric in the same position.
	const selectedStats = 0;

	try {
		if ( statsError || ! statsReport || totalsError || ! totalsReport ) {
			throw new Error( 'Site Kit: Analytics 4 report unavailable.' );
		}

		const total =
			Number(
				totalsReport?.totals?.[ 0 ]?.metricValues?.[ selectedStats ]
					?.value
			) || 0;
		const { change } = getMetricDatapointAndChange(
			totalsReport,
			selectedStats
		);

		const chartData = getAnalyticsChartData(
			statsReport,
			selectedStats,
			dateRangeLength,
			referenceDate,
			dataLabels,
			tooltipDataFormats,
			chartDataFormats
		);

		const chartImage = await rasterizeChart( {
			dataRows: chartData.slice( 1 ),
			currentLabel,
			color,
			signal,
		} );

		return { metric: { total, change }, chartImage };
	} catch {
		return { metric: null, chartImage: null };
	}
}

/**
 * Loads the reports and rasterised line charts for the Search traffic over time PDF widget.
 *
 * Resolves the four reports (Search Console impressions/clicks, GA4 Key Events
 * overview and series, GA4 Unique Visitors) in parallel, cancelling incomplete and
 * yet-to-have-started resolutions when the supplied signal is aborted.
 *
 * Once the reports resolve, loads Google Charts offscreen and rasterises a
 * current/previous line chart per metric.
 *
 * Per-metric report or rasterization failures are isolated so the component can
 * render a per-card "Data unavailable" placeholder; the loader only throws when
 * all four metrics fail.
 *
 * @since n.e.x.t
 *
 * @param {Object}      params          Loader parameters.
 * @param {Object}      params.registry WordPress data registry.
 * @param {Object}      params.dates    Report date range.
 * @param {AbortSignal} params.signal   Cancellation signal.
 * @return {Promise<Object>} Resolved metric data and chart images.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< SearchFunnelPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const { startDate, endDate, compareStartDate, compareEndDate } = dates;

	const url = registry.select( CORE_SITE ).getCurrentEntityURL() || undefined;

	const searchConsoleArgs = getSearchConsoleReportOptions( {
		compareStartDate,
		endDate,
		url,
	} );
	const keyEventsOverviewArgs = getGA4KeyEventsOverviewReportOptions( {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		url,
	} );
	const keyEventsStatsArgs = getGA4KeyEventsReportOptions( {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		url,
	} );
	const visitorsArgs = getGA4VisitorsReportOptions( {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		url,
	} );

	const [ searchConsole, keyEventsOverview, keyEventsStats, visitors ] =
		await Promise.all( [
			resolveReport(
				registry,
				MODULES_SEARCH_CONSOLE,
				searchConsoleArgs,
				signal
			),
			resolveReport< Report >(
				registry,
				MODULES_ANALYTICS_4,
				keyEventsOverviewArgs,
				signal
			),
			resolveReport< Report >(
				registry,
				MODULES_ANALYTICS_4,
				keyEventsStatsArgs,
				signal
			),
			resolveReport< Report >(
				registry,
				MODULES_ANALYTICS_4,
				visitorsArgs,
				signal
			),
		] );

	if ( signal.aborted ) {
		return { data: null };
	}

	await ensureGoogleChartsLoaded();

	// Cancelling during the report fetch or chart load aborts before any of the
	// four line charts are rasterised.
	if ( signal.aborted ) {
		return { data: null };
	}

	const dateRangeLength = registry
		.select( CORE_USER )
		.getDateRangeNumberOfDays();
	const referenceDate = registry.select( CORE_USER ).getReferenceDate();

	function numericTooltipFormatter( x: number | string ): string {
		return ( typeof x === 'string' ? parseFloat( x ) : x ).toLocaleString();
	}

	function percentageTooltipFormatter( x: number | string ): string {
		return numFmt( ( typeof x === 'string' ? parseFloat( x ) : x ) / 100, {
			style: 'percent',
			signDisplay: 'never',
			maximumFractionDigits: 2,
		} );
	}

	const [ impressions, clicks, uniqueVisitors, keyEvents ] =
		await Promise.all( [
			buildSearchConsoleCard( {
				report: searchConsole.report,
				reportError: searchConsole.error,
				metricKey: 'impressions',
				currentLabel: __( 'Impressions', 'google-site-kit' ),
				color: IMPRESSIONS_COLOR,
				dateRangeLength,
				signal,
			} ),
			buildSearchConsoleCard( {
				report: searchConsole.report,
				reportError: searchConsole.error,
				metricKey: 'clicks',
				currentLabel: __( 'Clicks', 'google-site-kit' ),
				color: CLICKS_COLOR,
				dateRangeLength,
				signal,
			} ),
			buildAnalyticsCard( {
				statsReport: visitors.report,
				statsError: visitors.error,
				totalsReport: visitors.report,
				totalsError: visitors.error,
				currentLabel: __( 'Unique visitors', 'google-site-kit' ),
				dataLabels: [ __( 'Unique visitors', 'google-site-kit' ) ],
				tooltipDataFormats: [ numericTooltipFormatter ],
				chartDataFormats: [ identity ],
				color: UNIQUE_VISITORS_COLOR,
				dateRangeLength,
				referenceDate,
				signal,
			} ),
			buildAnalyticsCard( {
				statsReport: keyEventsStats.report,
				statsError: keyEventsStats.error,
				totalsReport: keyEventsOverview.report,
				totalsError: keyEventsOverview.error,
				currentLabel: __( 'Key events', 'google-site-kit' ),
				dataLabels: [
					__( 'Key events', 'google-site-kit' ),
					__( 'Engagement Rate %', 'google-site-kit' ),
				],
				tooltipDataFormats: [
					numericTooltipFormatter,
					percentageTooltipFormatter,
				],
				chartDataFormats: [ identity, ( x ) => x * 100 ],
				color: KEY_EVENTS_COLOR,
				dateRangeLength,
				referenceDate,
				signal,
			} ),
		] );

	if ( signal.aborted ) {
		return { data: null };
	}

	const chartImages = {
		impressions: impressions.chartImage,
		clicks: clicks.chartImage,
		uniqueVisitors: uniqueVisitors.chartImage,
		keyEvents: keyEvents.chartImage,
	};

	// Only fail the whole widget when every metric failed; otherwise the
	// surviving cards still render alongside per-card placeholders.
	if ( Object.values( chartImages ).every( ( image ) => image === null ) ) {
		throw new Error(
			'Site Kit: all Search traffic over time metrics failed to load for the PDF export.'
		);
	}

	return {
		data: {
			dateRangeLength,
			metrics: {
				impressions: impressions.metric,
				clicks: clicks.metric,
				uniqueVisitors: uniqueVisitors.metric,
				keyEvents: keyEvents.metric,
			},
		},
		chartImages,
	};
}
