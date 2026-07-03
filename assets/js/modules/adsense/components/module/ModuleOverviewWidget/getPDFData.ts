/**
 * ModuleOverviewWidget PDF data loader.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ensureGoogleChartsLoaded from '@/js/components/pdf-export/ensure-google-charts-loaded';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import renderGoogleChartToDataURI, {
	getVisualization,
} from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import {
	getSiteStatsDataForGoogleChart,
	isZeroReport,
} from '@/js/modules/adsense/util';
import { calculateChange } from '@/js/util';
import {
	AdSenseReportOptions,
	MODULE_OVERVIEW_METRICS,
	getCurrentRangeArgs,
	getCurrentRangeChartArgs,
	getPreviousRangeArgs,
	getPreviousRangeChartArgs,
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
 * One key per report metric, exposed to the PDF component and its tests.
 *
 * @since n.e.x.t
 */
export type ModuleOverviewMetricKey =
	| 'estimatedEarnings'
	| 'pageRPM'
	| 'impressions'
	| 'pageCTR';

/**
 * The four metrics in report column order, each with its dashboard chart
 * series color.
 */
const METRIC_DEFINITIONS: Array< {
	key: ModuleOverviewMetricKey;
	color: string;
} > = [
	{ key: 'estimatedEarnings', color: PDF_COLORS.BLUE_B_400 },
	{ key: 'pageRPM', color: PDF_COLORS.TEAL_T_300 },
	{ key: 'impressions', color: PDF_COLORS.SITE_KIT_SK_500 },
	{ key: 'pageCTR', color: PDF_COLORS.VIOLET_V_300 },
];

/**
 * A single cell of an AdSense report row.
 */
interface AdSenseReportCell {
	/** The cell's metric or dimension value, as the API returns it. */
	value?: string | number;
}

/**
 * A single column header of an AdSense report.
 */
interface AdSenseReportHeader {
	/** The metric or dimension identifier, like `ESTIMATED_EARNINGS`. */
	name?: string;
	/** The column's value type, like `METRIC_CURRENCY` or `METRIC_RATIO`. */
	type?: string;
	/** The currency code of a `METRIC_CURRENCY` column, like `USD`. */
	currencyCode?: string;
}

/**
 * A report boundary date, split into its parts as the AdSense API returns it.
 */
interface AdSenseReportDate {
	/** The four-digit year. */
	year?: number;
	/** The month, from 1 to 12. */
	month?: number;
	/** The day of the month, from 1 to 31. */
	day?: number;
}

/**
 * The slice of an AdSense report this loader reads.
 *
 * The AdSense datastore is untyped JavaScript, so this local shape covers
 * only the fields the loader touches. Replace it with the store's own type
 * once that module is migrated to TypeScript.
 */
interface AdSenseReport {
	/** First day of the report. */
	startDate?: AdSenseReportDate;
	/** Last day of the report. */
	endDate?: AdSenseReportDate;
	/** One header per column, in column order. */
	headers?: AdSenseReportHeader[];
	/** The report totals, one cell per column. */
	totals?: { cells?: AdSenseReportCell[] };
	/** One row per dimension value, each with one cell per column. */
	rows?: Array< { cells?: AdSenseReportCell[] } >;
}

/**
 * A single row of Google Charts data.
 *
 * Rows hold a leading `Date` for the day column, an HTML tooltip string, and
 * the current and previous metric numbers the AdSense chart utility produces.
 */
type ChartRow = Array< Date | number | string | null >;

/**
 * The chart and report utilities below are still untyped JS modules. We alias
 * each to the shape this loader relies on so the rest of the file stays
 * type-checked. Replace these aliases with the real types once the underlying
 * modules are migrated to TypeScript.
 */
const getAdSenseChartData = getSiteStatsDataForGoogleChart as unknown as (
	current: AdSenseReport,
	previous: AdSenseReport,
	label: string,
	selectedColumn: number,
	metadata: AdSenseReportHeader | undefined
) => ChartRow[];

const isZeroAdSenseReport = isZeroReport as unknown as (
	report: AdSenseReport | undefined,
	selectedStatsIndex: number
) => boolean | undefined;

const calculateMetricChange = calculateChange as unknown as (
	previous: number,
	current: number
) => number | null;

/**
 * Total and change for one metric card.
 *
 * @since n.e.x.t
 */
export interface ModuleOverviewMetric {
	/** Total for the current period. */
	total: number;
	/** Period-over-period change ratio, or `null` when it can't be computed. */
	change: number | null;
}

/**
 * Resolved output of the loader.
 *
 * @since n.e.x.t
 */
export interface ModuleOverviewPDFData {
	/** Widget data, or `null` when the export is canceled or no metric has data. */
	data: {
		/** Number of days in the date range. */
		dateRangeLength: number;
		/** Currency code from the report, for the Earnings and Page RPM values. */
		currencyCode?: string;
		/** Total and change per metric, `null` for a metric without data. */
		metrics: Record< ModuleOverviewMetricKey, ModuleOverviewMetric | null >;
	} | null;
	/** Rendered line chart data URIs, `null` for a metric without data. */
	chartImages?: Record< ModuleOverviewMetricKey, string | null >;
}

interface MetricCardResult {
	/** Total and change for the metric, or `null` when the card failed. */
	metric: ModuleOverviewMetric | null;
	/** Rendered chart image as a data URI, or `null` when the card failed. */
	chartImage: string | null;
}

/**
 * Builds Google Charts options matching the PDF report's line charts.
 *
 * The current period draws as a solid smoothed line and the previous period as
 * a dotted line of the same color, mirroring the dashboard.
 *
 * @since n.e.x.t
 *
 * @param options         Options.
 * @param options.color   Series color for both lines.
 * @param options.ticks   Date ticks for the horizontal axis.
 * @param options.hasData Whether any data point is greater than zero.
 * @return Google Charts options object.
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
			left: 8 * LINE_CHART_OPTION_SCALE,
			right: 40 * LINE_CHART_OPTION_SCALE,
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
				fontSize: 14 * LINE_CHART_OPTION_SCALE,
			},
			ticks,
		},
		vAxis: {
			gridlines: {
				color: PDF_COLORS.SURFACES_SURFACE_1,
			},
			minorGridlines: {
				color: PDF_COLORS.SURFACES_SURFACE,
			},
			textStyle: {
				color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
				fontName: 'Google Sans Text',
				fontSize: 14 * LINE_CHART_OPTION_SCALE,
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
 * @since n.e.x.t
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
 * @since n.e.x.t
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
	// A tick per day, dropping the first so a tick sits at the range start,
	// matching the dashboard's overview chart. The leading column is always
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
 * Resolves an AdSense report and reads its resolved value plus any selector error.
 *
 * @since n.e.x.t
 *
 * @param registry WordPress data registry.
 * @param args     Report args.
 * @param signal   Cancellation signal.
 * @return The resolved report and any error.
 */
async function resolveReport(
	registry: GetPDFDataParams[ 'registry' ],
	args: AdSenseReportOptions,
	signal: AbortSignal
): Promise< { report: AdSenseReport | undefined; error: unknown } > {
	await registry
		.resolveSelect( MODULES_ADSENSE )
		.getReport( args, { signal } );

	return {
		report: registry.select( MODULES_ADSENSE ).getReport( args ),
		error: registry
			.select( MODULES_ADSENSE )
			.getErrorForSelector( 'getReport', [ args ] ),
	};
}

/**
 * Builds one metric card with its total, change, and rendered chart.
 *
 * Failures are isolated to the card: the returned `metric` and `chartImage`
 * are both `null`, so the widget skips that card.
 *
 * @since n.e.x.t
 *
 * @param options                Options for building the card.
 * @param options.currentTotals  Resolved current-period totals report.
 * @param options.previousTotals Resolved previous-period totals report.
 * @param options.currentChart   Resolved current-period daily series report.
 * @param options.previousChart  Resolved previous-period daily series report.
 * @param options.index          Metric position in the report column order.
 * @param options.label          Card label, also the chart's series label.
 * @param options.color          Series color for the chart.
 * @param options.signal         Cancellation signal.
 * @return The metric card result.
 */
async function buildMetricCard( {
	currentTotals,
	previousTotals,
	currentChart,
	previousChart,
	index,
	label,
	color,
	signal,
}: {
	currentTotals: AdSenseReport;
	previousTotals: AdSenseReport;
	currentChart: AdSenseReport;
	previousChart: AdSenseReport;
	index: number;
	label: string;
	color: string;
	signal: AbortSignal;
} ): Promise< MetricCardResult > {
	try {
		const total =
			Number( currentTotals.totals?.cells?.[ index ]?.value ) || 0;
		const previousTotal =
			Number( previousTotals.totals?.cells?.[ index ]?.value ) || 0;
		const change = calculateMetricChange( previousTotal, total );

		// The DATE dimension is the first column of the daily series reports,
		// so the metric sits one column to the right of its totals position.
		const chartData = getAdSenseChartData(
			currentChart,
			previousChart,
			label,
			index + 1,
			currentChart.headers?.[ index + 1 ]
		);

		const chartImage = await renderMetricChart( {
			dataRows: chartData.slice( 1 ),
			currentLabel: label,
			color,
			signal,
		} );

		return { metric: { total, change }, chartImage };
	} catch {
		return { metric: null, chartImage: null };
	}
}

/**
 * Loads the reports and renders the line charts for the Earning performance over time PDF widget.
 *
 * Resolves the four AdSense reports (current and previous totals, current and
 * previous daily series) in parallel, canceling resolutions that are incomplete
 * or not yet started when the signal aborts. Any report failure fails the whole
 * widget, because all four cards read the same reports.
 *
 * Once the reports resolve, a metric with no data in either period is dropped,
 * matching the dashboard's zero-report definition, so its card is not rendered.
 * When every metric is empty, `data` is `null` and the report skips the whole
 * section. Otherwise Google Charts loads offscreen and renders a line chart per
 * remaining metric with its current and previous period.
 *
 * @since n.e.x.t
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
}: GetPDFDataParams ): Promise< ModuleOverviewPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const [ currentTotals, previousTotals, currentChart, previousChart ] =
		await Promise.all( [
			resolveReport( registry, getCurrentRangeArgs( dates ), signal ),
			resolveReport( registry, getPreviousRangeArgs( dates ), signal ),
			resolveReport(
				registry,
				getCurrentRangeChartArgs( dates ),
				signal
			),
			resolveReport(
				registry,
				getPreviousRangeChartArgs( dates ),
				signal
			),
		] );

	if ( signal.aborted ) {
		return { data: null };
	}

	const resolved = [
		currentTotals,
		previousTotals,
		currentChart,
		previousChart,
	];

	// All four cards read the same reports, so one failed report leaves no
	// complete card to render.
	if ( resolved.some( ( { report, error } ) => error || ! report ) ) {
		throw new Error(
			'Site Kit: the Earning performance over time reports failed to load for the PDF export.'
		);
	}

	// A metric with no data in either period is not rendered, matching the
	// dashboard's zero-report definition for the selected stat.
	const metricHasData = METRIC_DEFINITIONS.map(
		( _, index ) =>
			! (
				isZeroAdSenseReport( currentChart.report, index + 1 ) ===
					true &&
				isZeroAdSenseReport( previousChart.report, index + 1 ) === true
			)
	);

	// With no data in any metric the report skips the whole section, so no
	// chart work is needed.
	if ( ! metricHasData.some( Boolean ) ) {
		return { data: null };
	}

	await ensureGoogleChartsLoaded();

	// Canceling during the report fetch or chart load aborts before any of the
	// four line charts render.
	if ( signal.aborted ) {
		return { data: null };
	}

	const metricLabels = Object.values( MODULE_OVERVIEW_METRICS );

	const cards = await Promise.all(
		METRIC_DEFINITIONS.map( ( { color }, index ) => {
			if ( ! metricHasData[ index ] ) {
				return Promise.resolve< MetricCardResult >( {
					metric: null,
					chartImage: null,
				} );
			}

			return buildMetricCard( {
				currentTotals: currentTotals.report as AdSenseReport,
				previousTotals: previousTotals.report as AdSenseReport,
				currentChart: currentChart.report as AdSenseReport,
				previousChart: previousChart.report as AdSenseReport,
				index,
				label: metricLabels[ index ],
				color,
				signal,
			} );
		} )
	);

	if ( signal.aborted ) {
		return { data: null };
	}

	const [ estimatedEarnings, pageRPM, impressions, pageCTR ] = cards;

	const chartImages = {
		estimatedEarnings: estimatedEarnings.chartImage,
		pageRPM: pageRPM.chartImage,
		impressions: impressions.chartImage,
		pageCTR: pageCTR.chartImage,
	};

	// Reaching here means at least one metric has data, so an empty image map
	// can only come from render failures. Fail the whole widget then, and the
	// report skips it.
	if ( Object.values( chartImages ).every( ( image ) => image === null ) ) {
		throw new Error(
			'Site Kit: all Earning performance over time metrics failed to load for the PDF export.'
		);
	}

	const dateRangeLength = registry
		.select( CORE_USER )
		.getDateRangeNumberOfDays();
	const currencyCode = currentTotals.report?.headers?.[ 0 ]?.currencyCode;

	return {
		data: {
			dateRangeLength,
			currencyCode,
			metrics: {
				estimatedEarnings: estimatedEarnings.metric,
				pageRPM: pageRPM.metric,
				impressions: impressions.metric,
				pageCTR: pageCTR.metric,
			},
		},
		chartImages,
	};
}
