/**
 * PDF data loader for the AdSense overview widget.
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
 * chart margins in pixels of the rendered chart. Those values fit the
 * renderer's default scale factor of 2, so this ratio scales them up to keep
 * the chart's proportions at the larger render size.
 */
const LINE_CHART_OPTION_SCALE = LINE_CHART_SCALE_FACTOR / 2;

/**
 * One key per report metric, shared with the PDF component and its tests.
 *
 * @since n.e.x.t
 */
export type ModuleOverviewMetricKey =
	| 'estimatedEarnings'
	| 'pageRPM'
	| 'impressions'
	| 'pageCTR';

/**
 * The four metrics in report column order, each with its chart line color
 * from the dashboard.
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
 * One cell of an AdSense report row.
 */
interface AdSenseReportCell {
	/** The cell's metric or dimension value, as the API returns it. */
	value?: string | number;
}

/**
 * One column header of an AdSense report.
 */
interface AdSenseReportHeader {
	/** The metric or dimension ID, like `ESTIMATED_EARNINGS`. */
	name?: string;
	/** The column's value type, like `METRIC_CURRENCY` or `METRIC_RATIO`. */
	type?: string;
	/** The currency code of a `METRIC_CURRENCY` column, like `USD`. */
	currencyCode?: string;
}

/**
 * A report start or end date, split into parts the way the AdSense API
 * returns it.
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
 * The part of an AdSense report this loader reads.
 *
 * The AdSense datastore is untyped JavaScript, so this local type covers only
 * the fields the loader reads. Replace it with the store's own type once that
 * module moves to TypeScript.
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
 * One row of Google Charts data.
 *
 * Each row holds a leading `Date` for the day, an HTML tooltip string, and the
 * current and previous metric numbers from the AdSense chart utility.
 */
type ChartRow = Array< Date | number | string | null >;

/**
 * The chart and report utilities below are still untyped JS modules. Each
 * alias gives them the shape this loader needs, so the rest of the file stays
 * type-checked. Replace the aliases with the real types once those modules
 * move to TypeScript.
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
 * The loader's resolved result.
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
 * Builds the Google Charts options for a metric's line chart in the PDF report.
 *
 * The current period is a solid smooth line. The previous period is a dotted
 * line of the same color, matching the dashboard.
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
				// Limit the axis when there's no data, so a flat zero line
				// still reads well.
				...( hasData ? {} : { max: 1 } ),
			},
		},
		series: {
			0: {
				color,
				lineWidth: 4 * LINE_CHART_OPTION_SCALE,
				// Axis index 1 draws the y-axis on the right, like the All Traffic
				// chart, so every report chart keeps its y-axis on the same side.
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
 * Builds the Google Charts `DataTable` for a metric's current and previous
 * line chart.
 *
 * Reads the dashboard's chart-data rows (a date, a tooltip, the current value,
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
			'Site Kit: Google Charts DataTable is missing after the library loaded.'
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
	// One tick per day after the first day, matching the dashboard's
	// overview chart. The first column is always the day `Date`.
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
 * Resolves an AdSense report, then reads its value and any selector error.
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
 * When the card fails, both `metric` and `chartImage` come back `null`, and
 * the widget skips that card.
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

		// The DATE dimension fills the first column of the daily series
		// reports, so each metric sits one column right of its position in the
		// totals report.
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
 * Loads the four AdSense reports and renders one line chart per metric for the
 * Earning performance over time PDF widget.
 *
 * Fetches the current and previous totals and daily series at the same time,
 * and stops when the signal aborts. One failed report fails the whole widget,
 * because all four cards read the same reports. A metric with no data in either
 * period is dropped. When every metric is empty, `data` is `null` and the
 * report skips the section.
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

	// The widget skips a metric with no data in either period, matching how
	// the dashboard treats a zero report for the selected stat.
	const metricHasData = METRIC_DEFINITIONS.map(
		( _, index ) =>
			! (
				isZeroAdSenseReport( currentChart.report, index + 1 ) ===
					true &&
				isZeroAdSenseReport( previousChart.report, index + 1 ) === true
			)
	);

	// When no metric has data, the report skips the whole section, so there's
	// no chart work to do.
	if ( ! metricHasData.some( Boolean ) ) {
		return { data: null };
	}

	await ensureGoogleChartsLoaded();

	// If the export is canceled while the reports fetch or the charts load, it
	// stops before any of the four line charts render.
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

	// At this point at least one metric has data, so an empty image map can
	// only mean every chart render failed. Fail the whole widget then, and the
	// report skips it.
	if ( Object.values( chartImages ).every( ( image ) => image === null ) ) {
		throw new Error(
			'Site Kit: all Earning performance over time charts failed to render for the PDF export.'
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
