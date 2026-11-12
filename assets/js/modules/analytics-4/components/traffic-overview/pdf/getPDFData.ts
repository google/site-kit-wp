/**
 * Traffic Overview PDF data loader.
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
import {
	getValueAxisFormat,
	getValueAxisGutter,
	pickDateTicks,
} from '@/js/components/pdf-export/chart-axis';
import ensureGoogleChartsLoaded from '@/js/components/pdf-export/ensure-google-charts-loaded';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import renderGoogleChartToDataURI, {
	getVisualization,
} from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { PLACEHOLDER_TRAFFIC_BREAKDOWN } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/placeholderTrafficBreakdown';
import { getPlaceholderDailyTraffic } from '@/js/modules/analytics-4/components/traffic-overview/charts/placeholderTrafficChartData';
import { getTotalsReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import {
	TrafficBreakdownRow,
	getBreakdownRows,
} from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { stringToDate } from '@/js/util';

export type { TrafficBreakdownRow };

/**
 * The chart fills `PDFCard`'s content width, and `TrafficOverviewPDF` shows it
 * in a box of the same size, so the image never stretches. 1085 is `PDFCard`'s
 * content width in the Figma design: 1133 minus `PDFCard`'s 24px padding on
 * each side.
 */
const LINE_CHART_WIDTH = 1085;
const LINE_CHART_HEIGHT = 133;

/**
 * How many times bigger than its display size the line chart renders, so the
 * line stays sharp in the PDF.
 */
const LINE_CHART_SCALE_FACTOR = 2;

export interface GetPDFDataParams {
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
	/** Report date range. */
	dates: Pick<
		ReportOptions,
		'startDate' | 'endDate' | 'compareStartDate' | 'compareEndDate'
	>;
	/** Signal that cancels the export. */
	signal: AbortSignal;
}

export interface TrafficOverviewPDFData {
	/** The totals report, the daily traffic, and the breakdown rows, or `null` when the export is canceled. */
	data: {
		/** GA4 totals report with the current and comparison range totals. */
		totalsReport: Report;
		/** The visits on each day of the range, oldest first, which the line chart is drawn from. */
		dailyTraffic: BenchmarkingDailyTrafficRow[];
		/** Ranked rows for the channels breakdown. */
		channelBreakdown: TrafficBreakdownRow[];
		/** Ranked rows for the locations breakdown. */
		locationBreakdown: TrafficBreakdownRow[];
		/** Ranked rows for the devices breakdown. */
		deviceBreakdown: TrafficBreakdownRow[];
	} | null;
	/** Rendered chart images as JPEG data URIs. */
	chartImages?: {
		/** The All visitors line chart image. */
		lineChart: string;
	};
}

interface LineChartPoint {
	/** The day the point covers. */
	date: Date;
	/** The visits on that day. */
	value: number;
}

/**
 * Turns the daily traffic into the line chart's points.
 *
 * @since 1.189.0
 * @since n.e.x.t Changed the `graphReport` parameter to `dailyTraffic`.
 *
 * @param {Array<Object>} dailyTraffic The visits on each day, oldest first.
 * @return {Array<Object>} Points of `{ date, value }`, in the same order.
 */
function getLineChartPoints(
	dailyTraffic: BenchmarkingDailyTrafficRow[]
): LineChartPoint[] {
	return dailyTraffic.map( ( { date, visits } ) => ( {
		date: stringToDate( date ),
		value: visits,
	} ) );
}

/**
 * Builds the Google Charts `DataTable` for the All Visitors line chart.
 *
 * The table has the "Day" and "Visits" columns of the dashboard chart's table,
 * which `getTrafficChartData()` builds.
 *
 * @since 1.189.0
 * @since n.e.x.t Names the second column "Visits" in place of "Users".
 *
 * @param {Array<Object>} points Parsed chart points.
 * @return {Object} A `google.visualization.DataTable` instance.
 */
function buildLineChartDataTable( points: LineChartPoint[] ): object {
	const visualization = getVisualization();
	if ( ! visualization?.DataTable ) {
		throw new Error(
			'Site Kit: Google Charts DataTable is unavailable after loading the library.'
		);
	}

	const dataTable = new visualization.DataTable();
	dataTable.addColumn( 'date', __( 'Day', 'google-site-kit' ) );
	dataTable.addColumn( 'number', __( 'Visits', 'google-site-kit' ) );
	dataTable.addRows( points.map( ( { date, value } ) => [ date, value ] ) );

	return dataTable;
}

/**
 * Builds Google Charts options matching the Traffic Overview card's line chart.
 *
 * @since 1.189.0
 *
 * @param {Array<Object>} points Parsed chart points.
 * @return {Object} Google Charts options object.
 */
function getLineChartOptions( points: LineChartPoint[] ): object {
	const fontSize = 14;
	const chartAreaLeft = 8;
	const maxValue = points.reduce(
		( highest, { value } ) => Math.max( highest, value ),
		0
	);
	const valueAxisGutter = getValueAxisGutter( maxValue, fontSize );

	return {
		curveType: 'function',
		// `PDF_COLORS.VIOLET_V_600` holds the same hex as `TRAFFIC_CHART_LINE_COLOR`
		// in `traffic-overview/charts/trafficChartOptions.ts`, the color the
		// dashboard's line chart draws in.
		colors: [ PDF_COLORS.VIOLET_V_600 ],
		chartArea: {
			left: chartAreaLeft,
			right: valueAxisGutter,
			top: 16,
			bottom: 28,
		},
		legend: {
			position: 'none',
		},
		hAxis: {
			gridlines: {
				color: PDF_COLORS.SURFACES_SURFACE,
			},
			textPosition: 'out',
			textStyle: {
				color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
				fontName: 'Google Sans Text',
				fontSize,
			},
			ticks: pickDateTicks(
				points.map( ( { date } ) => date ),
				LINE_CHART_WIDTH * LINE_CHART_SCALE_FACTOR -
					chartAreaLeft -
					valueAxisGutter,
				fontSize
			),
		},
		vAxis: {
			format: getValueAxisFormat( maxValue ),
			gridlines: {
				color: PDF_COLORS.SURFACES_SURFACE_1,
			},
			lineWidth: 3,
			minorGridlines: {
				color: PDF_COLORS.SURFACES_SURFACE,
			},
			minValue: 0,
			textPosition: 'out',
			textStyle: {
				color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
				fontName: 'Google Sans Text',
				fontSize,
			},
			viewWindow: {
				min: 0,
				// With no data, stop the axis at 100, so the flat line at zero is
				// still easy to read.
				...( maxValue > 0 ? {} : { max: 100 } ),
			},
		},
		series: {
			0: {
				color: PDF_COLORS.VIOLET_V_600,
				lineWidth: 4,
				targetAxisIndex: 1,
			},
		},
		focusTarget: 'category',
	};
}

/**
 * Loads the totals report and the line chart image for the Traffic Overview
 * PDF section.
 *
 * Fetches the totals report, and stops early when the signal is aborted. Then
 * it draws the line chart of the placeholder daily traffic as a JPEG data URI
 * for the PDF. The rows of each placeholder breakdown are shaped with the same
 * `getBreakdownRows()` the dashboard's columns use, so the printed rows always
 * match.
 *
 * @since 1.189.0
 * @since n.e.x.t Draws the line chart and the breakdowns from placeholder data, so it fetches only the totals report.
 *
 * @param {Object}      params          Loader parameters.
 * @param {Object}      params.registry WordPress data registry.
 * @param {Object}      params.dates    Report date range.
 * @param {AbortSignal} params.signal   Cancellation signal.
 * @return {Object} Resolved report data and chart images.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< TrafficOverviewPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const { startDate, endDate, compareStartDate, compareEndDate } = dates;

	const url = registry.select( CORE_SITE ).getCurrentEntityURL() || undefined;

	const totalsArgs = getTotalsReportArgs( {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		url,
	} );

	// The registry remembers each `getReport` call by its arguments, and
	// every abort signal looks the same to it. After a canceled or failed
	// run, the registry would treat the call below as already done and
	// return an `undefined` report without fetching. Invalidate the earlier
	// call, so this run fetches the report again. A report that already
	// loaded stays in state, so a successful earlier run adds no extra
	// request.
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.invalidateResolution( 'getReport', [ totalsArgs, { signal } ] );

	const totalsReport = await registry
		.resolveSelect( MODULES_ANALYTICS_4 )
		.getReport( totalsArgs, { signal } );

	if ( signal.aborted ) {
		return { data: null };
	}

	await ensureGoogleChartsLoaded();

	// Canceling during loading stops here, before the chart is drawn.
	if ( signal.aborted ) {
		return { data: null };
	}

	// TODO: Read the visits on each day from the benchmarking response.
	const dailyTraffic = getPlaceholderDailyTraffic( startDate, endDate );
	const points = getLineChartPoints( dailyTraffic );

	const lineChart = await renderGoogleChartToDataURI( {
		chartType: 'LineChart',
		dataTable: buildLineChartDataTable( points ),
		options: getLineChartOptions( points ),
		width: LINE_CHART_WIDTH,
		height: LINE_CHART_HEIGHT,
		scaleFactor: LINE_CHART_SCALE_FACTOR,
		signal,
	} );

	if ( signal.aborted ) {
		return { data: null };
	}

	// TODO: Replace the placeholder breakdown with the site's own.
	const { channels, locations, devices } = PLACEHOLDER_TRAFFIC_BREAKDOWN;

	return {
		data: {
			totalsReport,
			dailyTraffic,
			channelBreakdown: getBreakdownRows( channels ),
			locationBreakdown: getBreakdownRows( locations ),
			deviceBreakdown: getBreakdownRows( devices ),
		},
		chartImages: {
			lineChart,
		},
	};
}
