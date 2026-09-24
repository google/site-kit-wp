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
import { TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/columns';
import {
	getBreakdownReportArgs,
	getGraphReportArgs,
	getTotalsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import {
	TrafficBreakdownRow,
	getBreakdownRows,
} from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';

export type { TrafficBreakdownRow };

/**
 * The chart draws at 1085 by 133, and the tile displays the image in a
 * box of the same size, so the image never stretches and no empty space
 * appears around it. 1085 is the full-width card's content width in the
 * Figma design (1133 minus `PDFCard`'s 24px padding on each side); unlike
 * the old All Traffic widget's narrower, two-up card, this card spans the
 * page on its own.
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

export interface AllTrafficPDFData {
	/** Loaded reports and breakdown rows, or `null` when the export is canceled. */
	data: {
		/** GA4 totals report with the current and comparison range totals. */
		totalsReport: Report;
		/** GA4 report with one row per day, which the line chart is drawn from. */
		graphReport: Report;
		/** Ranked rows for the channels breakdown, or `null` on a missing report. */
		channelBreakdown: TrafficBreakdownRow[] | null;
		/** Ranked rows for the locations breakdown, or `null` on a missing report. */
		locationBreakdown: TrafficBreakdownRow[] | null;
		/** Ranked rows for the devices breakdown, or `null` on a missing report. */
		deviceBreakdown: TrafficBreakdownRow[] | null;
	} | null;
	/** Rendered chart images as JPEG data URIs. */
	chartImages?: {
		/** The All visitors line chart image. */
		lineChart: string;
	};
}

interface LineChartPoint {
	/** Day the point covers, parsed from the row's date dimension. */
	date: Date;
	/** Total users on that day, `0` when the row has no value. */
	value: number;
}

/**
 * Reduces the date-dimension graph report into parsed chart points.
 *
 * Rows whose date fails to parse are dropped, matching the dashboard's
 * tolerance for malformed dimension values.
 *
 * @since n.e.x.t
 *
 * @param {Object} graphReport Date-dimension GA4 report.
 * @return {Array<Object>} Points of `{ date, value }`, ordered as returned.
 */
function getLineChartPoints( graphReport: Report ): LineChartPoint[] {
	return ( graphReport?.rows || [] ).reduce< LineChartPoint[] >(
		( points, row ) => {
			const dateString = row.dimensionValues?.[ 0 ]?.value;
			const date = dateString
				? parseDimensionStringToDate( dateString )
				: false;

			if ( date instanceof Date ) {
				points.push( {
					date,
					value: Number( row.metricValues?.[ 0 ]?.value ) || 0,
				} );
			}

			return points;
		},
		[]
	);
}

/**
 * Builds the Google Charts `DataTable` for the All Visitors line chart.
 *
 * Mirrors the dashboard's `UserCountGraph` shape: a date column followed by a
 * total-users column.
 *
 * @since n.e.x.t
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
	dataTable.addColumn( 'number', __( 'Users', 'google-site-kit' ) );
	dataTable.addRows( points.map( ( { date, value } ) => [ date, value ] ) );

	return dataTable;
}

/**
 * Builds Google Charts options matching the Traffic Overview card's line chart.
 *
 * @since n.e.x.t
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
			format: 'MMM d',
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
 * Loads the GA4 reports and the line chart image for the Traffic Overview PDF
 * section.
 *
 * Fetches the totals, graph, and three breakdown reports (channels, locations,
 * and devices) at the same time, and stops early when the signal is aborted.
 * Then it draws the line chart as a JPEG data URI for the PDF. Each breakdown's
 * rows are shaped with the same `getBreakdownRows()` the dashboard's columns
 * use, so the printed rows always match. A breakdown whose report failed gives
 * `null` rows, and the other breakdowns still render.
 *
 * @since n.e.x.t
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
}: GetPDFDataParams ): Promise< AllTrafficPDFData > {
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

	const graphArgs = getGraphReportArgs( {
		startDate,
		endDate,
		url,
	} );

	// Breakdown reports use the selected range only, since there's no
	// comparison range for a row to pair against.
	const breakdownArgsList = TRAFFIC_BREAKDOWN_COLUMNS.map(
		( { dimensionName, reportID } ) =>
			getBreakdownReportArgs( {
				dimensionName,
				reportID,
				startDate,
				endDate,
				url,
			} )
	);

	// The registry remembers each `getReport` call by its arguments, and
	// every abort signal looks the same to it. After a canceled or failed
	// run, the registry would treat the calls below as already done and
	// return `undefined` reports without fetching. Invalidate the earlier
	// calls, so this run fetches the reports again. A report that already
	// loaded stays in state, so a successful earlier run adds no extra
	// request.
	const { invalidateResolution } = registry.dispatch( MODULES_ANALYTICS_4 );
	invalidateResolution( 'getReport', [ totalsArgs, { signal } ] );
	invalidateResolution( 'getReport', [ graphArgs, { signal } ] );
	breakdownArgsList.forEach( ( args ) =>
		invalidateResolution( 'getReport', [ args, { signal } ] )
	);

	const [ totalsReport, graphReport, ...breakdownReports ] =
		await Promise.all( [
			registry
				.resolveSelect( MODULES_ANALYTICS_4 )
				.getReport( totalsArgs, { signal } ),
			registry
				.resolveSelect( MODULES_ANALYTICS_4 )
				.getReport( graphArgs, { signal } ),
			// A breakdown report that fails is caught here, so the rest of
			// the widget still renders and that breakdown's rows are `null`.
			...breakdownArgsList.map( ( args ) =>
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport( args, { signal } )
					.catch( () => null )
			),
		] );

	if ( signal.aborted ) {
		return { data: null };
	}

	await ensureGoogleChartsLoaded();

	// Canceling during loading stops here, before the chart is drawn.
	if ( signal.aborted ) {
		return { data: null };
	}

	const points = getLineChartPoints( graphReport );

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

	const [ channelBreakdown, locationBreakdown, deviceBreakdown ] =
		breakdownReports.map( ( report ) =>
			report ? getBreakdownRows( report ) : null
		);

	return {
		data: {
			totalsReport,
			graphReport,
			channelBreakdown,
			locationBreakdown,
			deviceBreakdown,
		},
		chartImages: {
			lineChart,
		},
	};
}
