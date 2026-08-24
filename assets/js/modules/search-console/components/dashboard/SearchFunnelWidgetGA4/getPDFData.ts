/**
 * SearchFunnelWidgetGA4 PDF data loader.
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
 * External dependencies
 */
import { identity } from 'lodash';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getValueAxisGutter,
	pickDateTicks,
} from '@/js/components/pdf-export/chart-axis';
import ensureGoogleChartsLoaded from '@/js/components/pdf-export/ensure-google-charts-loaded';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import renderGoogleChartToDataURI, {
	getVisualization,
} from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
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

/**
 * The chart draws at 506 by 133, and the tile displays the image in a
 * box of the same size, so the image never stretches and no empty
 * space appears around it.
 */
const LINE_CHART_WIDTH = 506;
const LINE_CHART_HEIGHT = 133;

/**
 * PDFs show each chart as an image. The chart renders at 4 times its
 * display size, so the lines stay sharp when the PDF shrinks the image to fit.
 */
const LINE_CHART_SCALE_FACTOR = 4;

/**
 * `getLineChartOptions` sets the line widths, dash lengths, font sizes, and
 * chart margins in pixels of the rendered chart. The values were chosen at the
 * renderer's default scale factor of 2, so this ratio grows them to keep the
 * chart's proportions at the larger render size.
 */
const LINE_CHART_OPTION_SCALE = LINE_CHART_SCALE_FACTOR / 2;

/**
 * The value a chart with no data caps its axis at.
 *
 * A flat zero line needs a range of its own, and `getValueAxisGutter` measures
 * the labels against the same cap.
 */
const EMPTY_AXIS_MAX_VALUE = 1;

type Registry = WPDataRegistry & {
	// `resolveSelect` exists on the runtime registry but is absent from the
	// `@wordpress/data` registry types. Alias it to the same loose shape as
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

/**
 * The chart and report utilities below are still untyped JS modules whose JSDoc
 * types are looser than their runtime contracts. We alias each to the shape
 * this loader relies on so the rest of the file stays type-checked. Their
 * `report` inputs are typed `unknown` because we don't yet have a shared
 * Search Console report type. The per-value format callbacks stay `any` because
 * their inputs genuinely vary per metric. Replace these aliases with the real
 * types once the underlying modules are migrated to TypeScript.
 */
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
	/** WordPress data registry. */
	registry: Registry;
	/** Report date range. */
	dates: {
		/** First day of the current period (YYYY-MM-DD). */
		startDate: string;
		/** Last day of the current period (YYYY-MM-DD). */
		endDate: string;
		/** First day of the previous period (YYYY-MM-DD). */
		compareStartDate: string;
		/** Last day of the previous period (YYYY-MM-DD). */
		compareEndDate: string;
	};
	/** Cancellation signal. */
	signal: AbortSignal;
}

export interface SearchFunnelMetric {
	/** Total for the current period. */
	total: number;
	/** Period-over-period change ratio, or `null` when it can't be computed. */
	change: number | null;
}

export interface SearchFunnelPDFData {
	/** Metric data for the widget, or `null` when the export is canceled. */
	data: {
		/** Number of days in the date range. */
		dateRangeLength: number;
		/** Total and change for each metric. */
		metrics: {
			/** Search Console impressions, or `null` when the metric failed. */
			impressions: SearchFunnelMetric | null;
			/** Search Console clicks, or `null` when the metric failed. */
			clicks: SearchFunnelMetric | null;
			/** GA4 unique visitors, or `null` when the metric failed. */
			uniqueVisitors: SearchFunnelMetric | null;
			/** GA4 key events, or `null` when the metric failed. */
			keyEvents: SearchFunnelMetric | null;
		};
	} | null;
	/** Rendered line chart data URIs, absent when the export is canceled. */
	chartImages?: {
		/** Impressions chart image, or `null` when the metric failed. */
		impressions: string | null;
		/** Clicks chart image, or `null` when the metric failed. */
		clicks: string | null;
		/** Unique visitors chart image, or `null` when the metric failed. */
		uniqueVisitors: string | null;
		/** Key events chart image, or `null` when the metric failed. */
		keyEvents: string | null;
	};
}

interface MetricCardResult {
	/** Total and change for the metric, or `null` when the card failed. */
	metric: SearchFunnelMetric | null;
	/** Rendered chart image as a data URI, or `null` when the card failed. */
	chartImage: string | null;
}

/**
 * Builds Google Charts options matching the dashboard's Search Funnel line
 * charts.
 *
 * The current period draws as a solid smoothed line and the previous period as a
 * dotted line of the same color, mirroring the dashboard.
 *
 * @since 1.183.0
 * @since n.e.x.t Fitted the value and date labels to the space they have.
 *
 * @param options          Options.
 * @param options.color    Series color for both lines.
 * @param options.dates    Every day in the range, in order.
 * @param options.maxValue The highest value either line reaches.
 * @return Google Charts options object.
 */
function getLineChartOptions( {
	color,
	dates,
	maxValue,
}: {
	color: string;
	dates: Date[];
	maxValue: number;
} ): object {
	const fontSize = 14 * LINE_CHART_OPTION_SCALE;
	const chartAreaLeft = 8 * LINE_CHART_OPTION_SCALE;
	const hasData = maxValue > 0;
	const valueAxisGutter = getValueAxisGutter(
		hasData ? maxValue : EMPTY_AXIS_MAX_VALUE,
		fontSize
	);

	return {
		curveType: 'function',
		colors: [ color ],
		chartArea: {
			left: chartAreaLeft,
			right: valueAxisGutter,
			top: 12 * LINE_CHART_OPTION_SCALE,
			bottom: 22 * LINE_CHART_OPTION_SCALE,
		},
		legend: {
			position: 'none',
		},
		hAxis: {
			format: 'MMM d',
			gridlines: {
				color: PDF_COLORS.SURFACES_SURFACE,
			},
			textStyle: {
				color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
				fontName: 'Google Sans Text',
				fontSize,
			},
			ticks: pickDateTicks(
				dates,
				LINE_CHART_WIDTH * LINE_CHART_SCALE_FACTOR -
					valueAxisGutter -
					chartAreaLeft,
				fontSize
			),
		},
		vAxes: {
			// The series render against axis 1, so axis 0 draws nothing.
			0: {
				gridlines: {
					color: 'transparent',
				},
				minorGridlines: {
					color: 'transparent',
				},
				textPosition: 'none',
			},
			1: {
				// A large value shortens to a magnitude letter, so 58000 reads
				// as `58K` and the label fits the width beside the plot.
				format: 'short',
				gridlines: {
					color: PDF_COLORS.SURFACES_SURFACE_1,
				},
				minorGridlines: {
					color: PDF_COLORS.SURFACES_SURFACE,
				},
				textStyle: {
					color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
					fontName: 'Google Sans Text',
					fontSize,
				},
				viewWindow: {
					min: 0,
					// Cap the empty-data axis so a flat zero line still reads well.
					...( hasData ? {} : { max: EMPTY_AXIS_MAX_VALUE } ),
				},
			},
		},
		series: {
			0: {
				color,
				lineWidth: 4 * LINE_CHART_OPTION_SCALE,
				// Index 1 renders the y-axis on the right, matching the All Traffic
				// chart, so every report chart keeps the axis on the same side.
				targetAxisIndex: 1,
			},
			1: {
				color,
				lineWidth: 4 * LINE_CHART_OPTION_SCALE,
				lineDashStyle: [
					2 * LINE_CHART_OPTION_SCALE,
					10 * LINE_CHART_OPTION_SCALE,
				],
				targetAxisIndex: 1,
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
 * @since 1.183.0
 *
 * @param dataRows     Chart data rows (without the header row).
 * @param currentLabel Column label for the current-period series.
 * @return A `google.visualization.DataTable` instance.
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
 * Renders a metric's current and previous line chart to a JPEG data URI.
 *
 * @since 1.183.0
 *
 * @param options              Options.
 * @param options.dataRows     Chart data rows (without the header row).
 * @param options.currentLabel Column label for the current-period series.
 * @param options.color        Series color for both lines.
 * @param options.signal       Cancellation signal.
 * @return The rendered chart image as a data URI.
 */
function renderMetricChart( {
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
	// The leading column is always the day `Date`, and the current and previous
	// values follow it.
	const dates = dataRows.map( ( row ) => row[ 0 ] as Date );
	const maxValue = dataRows.reduce(
		( highest, row ) =>
			Math.max(
				highest,
				Number( row[ 2 ] ) || 0,
				Number( row[ 3 ] ) || 0
			),
		0
	);

	return renderGoogleChartToDataURI( {
		chartType: 'LineChart',
		dataTable: buildChartDataTable( dataRows, currentLabel ),
		options: getLineChartOptions( { color, dates, maxValue } ),
		width: LINE_CHART_WIDTH,
		height: LINE_CHART_HEIGHT,
		scaleFactor: LINE_CHART_SCALE_FACTOR,
		signal,
	} );
}

/**
 * Resolves a report and reads its resolved value plus any selector error.
 *
 * @since 1.183.0
 *
 * @param registry  WordPress data registry.
 * @param storeName Datastore name to query.
 * @param args      Report args.
 * @param signal    Cancellation signal.
 * @return The resolved report and any error.
 */
async function resolveReport< T = unknown >(
	registry: Registry,
	storeName: string,
	args: SearchConsoleReportOptions | Analytics4ReportOptions,
	signal: AbortSignal
): Promise< { report: T | undefined; error: unknown } > {
	const report = await registry
		.resolveSelect( storeName )
		.getReport( args, { signal } );

	return {
		report,
		error: registry
			.select( storeName )
			.getErrorForSelector( 'getReport', [ args ] ),
	};
}

/**
 * Builds a Search Console metric card with its total, change, and rendered chart.
 *
 * Failures are isolated to the card: the returned `metric` and `chartImage` are
 * both `null`, so the widget skips that card.
 *
 * @since 1.183.0
 *
 * @param options                 Options for building the card.
 * @param options.report          Resolved Search Console report.
 * @param options.reportError     Selector error for the report, if any.
 * @param options.metricKey       Which metric the card represents.
 * @param options.currentLabel    Current-period series label.
 * @param options.color           Series color for the chart.
 * @param options.dateRangeLength Number of days in the date range.
 * @param options.signal          Cancellation signal.
 * @return The metric card result.
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
	// The Search Console report has no shared type yet, so it stays `unknown`
	// and `Array.isArray` narrows it below. Adjust this type once that store
	// is typed.
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

		const chartImage = await renderMetricChart( {
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
 * Builds an Analytics 4 metric card with its total, change, and rendered chart.
 *
 * Failures are isolated to the card: the returned `metric` and `chartImage` are
 * both `null`, so the widget skips that card.
 *
 * @since 1.183.0
 *
 * @param options                    Options for building the card.
 * @param options.statsReport        Resolved date-series report.
 * @param options.statsError         Selector error for the series report, if any.
 * @param options.totalsReport       Resolved totals report.
 * @param options.totalsError        Selector error for the totals report, if any.
 * @param options.currentLabel       Current-period series label.
 * @param options.dataLabels         Data labels passed to the extractor.
 * @param options.tooltipDataFormats Tooltip formatters passed to the extractor.
 * @param options.chartDataFormats   Chart value formatters passed to the extractor.
 * @param options.color              Series color for the chart.
 * @param options.dateRangeLength    Number of days in the date range.
 * @param options.referenceDate      Reference date for padding empty series.
 * @param options.signal             Cancellation signal.
 * @return The metric card result.
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
	// The Key Events report exposes its metric in the first column. The Unique
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

		const chartImage = await renderMetricChart( {
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
 * Loads the reports and renders the line charts for the Search traffic over time PDF widget.
 *
 * Resolves the four reports (Search Console impressions and clicks, GA4 Key
 * Events overview and series, and GA4 Unique Visitors) in parallel, canceling
 * resolutions that are incomplete or not yet started when the signal aborts.
 *
 * Once the reports resolve, loads Google Charts offscreen and renders a line
 * chart per metric with its current and previous period.
 *
 * A failed report or chart render is isolated to its own metric, and the
 * widget skips that card. The loader only throws when all four metrics fail.
 *
 * @since 1.183.0
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @return Resolved metric data and chart images.
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

	const includeGA4Reports = await registry
		.resolveSelect( CORE_MODULES )
		.isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

	const searchConsoleArgs = getSearchConsoleReportOptions( {
		compareStartDate,
		endDate,
		url,
	} );

	const ga4ReportArgs = {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		url,
	};

	let searchConsoleReportsToIncludeWhenAnalyticsIsActive: Promise< {
		report: Report | undefined;
		error: unknown;
	} >[] = [
		Promise.resolve( { report: undefined, error: null } ),
		Promise.resolve( { report: undefined, error: null } ),
		Promise.resolve( { report: undefined, error: null } ),
	];

	if ( includeGA4Reports ) {
		searchConsoleReportsToIncludeWhenAnalyticsIsActive = [
			resolveReport< Report >(
				registry,
				MODULES_ANALYTICS_4,
				getGA4KeyEventsOverviewReportOptions( ga4ReportArgs ),
				signal
			),
			resolveReport< Report >(
				registry,
				MODULES_ANALYTICS_4,
				getGA4KeyEventsReportOptions( ga4ReportArgs ),
				signal
			),
			resolveReport< Report >(
				registry,
				MODULES_ANALYTICS_4,
				getGA4VisitorsReportOptions( ga4ReportArgs ),
				signal
			),
		];
	}

	const [ searchConsole, keyEventsOverview, keyEventsStats, visitors ] =
		await Promise.all( [
			resolveReport(
				registry,
				MODULES_SEARCH_CONSOLE,
				searchConsoleArgs,
				signal
			),
			...searchConsoleReportsToIncludeWhenAnalyticsIsActive,
		] );

	if ( signal.aborted ) {
		return { data: null };
	}

	await ensureGoogleChartsLoaded();

	// Canceling during the report fetch or chart load aborts before any of the
	// four line charts render.
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

	const cardsToBuild: Promise< MetricCardResult >[] = [
		buildSearchConsoleCard( {
			report: searchConsole.report,
			reportError: searchConsole.error,
			metricKey: 'impressions',
			currentLabel: __( 'Impressions', 'google-site-kit' ),
			color: PDF_COLORS.BLUE_B_400,
			dateRangeLength,
			signal,
		} ),
		buildSearchConsoleCard( {
			report: searchConsole.report,
			reportError: searchConsole.error,
			metricKey: 'clicks',
			currentLabel: __( 'Clicks', 'google-site-kit' ),
			color: PDF_COLORS.TEAL_T_300,
			dateRangeLength,
			signal,
		} ),
	];

	if ( visitors.report ) {
		cardsToBuild.push(
			buildAnalyticsCard( {
				statsReport: visitors.report,
				statsError: visitors.error,
				totalsReport: visitors.report,
				totalsError: visitors.error,
				currentLabel: __( 'Unique visitors', 'google-site-kit' ),
				dataLabels: [ __( 'Unique visitors', 'google-site-kit' ) ],
				tooltipDataFormats: [ numericTooltipFormatter ],
				chartDataFormats: [ identity ],
				color: PDF_COLORS.SITE_KIT_SK_500,
				dateRangeLength,
				referenceDate,
				signal,
			} )
		);
	} else {
		cardsToBuild.push(
			Promise.resolve( { metric: null, chartImage: null } )
		);
	}

	if ( keyEventsStats.report && keyEventsOverview.report ) {
		cardsToBuild.push(
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
				color: PDF_COLORS.VIOLET_V_300,
				dateRangeLength,
				referenceDate,
				signal,
			} )
		);
	} else {
		cardsToBuild.push(
			Promise.resolve( { metric: null, chartImage: null } )
		);
	}

	const [ impressions, clicks, uniqueVisitors, keyEvents ] =
		await Promise.all( cardsToBuild );

	if ( signal.aborted ) {
		return { data: null };
	}

	const chartImages = {
		impressions: impressions.chartImage,
		clicks: clicks.chartImage,
		uniqueVisitors: uniqueVisitors.chartImage,
		keyEvents: keyEvents.chartImage,
	};

	// Only fail the whole widget when every metric failed. Otherwise the
	// surviving cards still render, and the failed cards render nothing.
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
