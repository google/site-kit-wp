/**
 * DashboardAllTrafficWidgetGA4 PDF data loader.
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
import { PIE_CHART_COLORS } from '@/js/components/pdf-export/pie-chart-colors';
import renderGoogleChartToDataURI, {
	getVisualization,
} from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { extractAnalyticsDataForPieChart } from '@/js/modules/analytics-4/utils/chart';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import {
	CHANNELS_BREAKDOWN_REPORT_ID,
	DEVICES_BREAKDOWN_REPORT_ID,
	LOCATIONS_BREAKDOWN_REPORT_ID,
	getBreakdownReportArgs,
	getGraphReportArgs,
	getTotalsReportArgs,
} from './reportOptions';

/**
 * The same color as the dashboard's All Visitors line, the default graph color.
 */
const LINE_CHART_COLOR = '#3c7251';
/**
 * The chart draws at 506 by 133, and the tile displays the image in a
 * box of the same size, so the image never stretches and no empty
 * space appears around it.
 */
const LINE_CHART_WIDTH = 506;
const LINE_CHART_HEIGHT = 133;

/**
 * The size of the hole in the middle of each breakdown donut, from 0 to 1.
 */
const BREAKDOWN_PIE_HOLE = 0.542;

/**
 * The width and height of each breakdown donut, in PDF points.
 */
const BREAKDOWN_CHART_SIZE = 72.85;

/**
 * How many times bigger than its display size each donut renders, so its curved
 * edges stay sharp in the PDF.
 */
const BREAKDOWN_CHART_SCALE_FACTOR = 4;

/**
 * How many top slices to keep for each breakdown. The rest combine into one
 * "Others" slice, the same as the dashboard's All Traffic pie.
 */
const BREAKDOWN_MAX_SLICES = 5;

/**
 * The three GA4 breakdowns shown below the line chart, in the order they
 * render. Each pairs a dashboard dimension with its own report ID, so the three
 * reports load and cache on their own.
 */
const BREAKDOWNS = [
	{
		dimensionName: 'sessionDefaultChannelGrouping',
		reportID: CHANNELS_BREAKDOWN_REPORT_ID,
	},
	{ dimensionName: 'country', reportID: LOCATIONS_BREAKDOWN_REPORT_ID },
	{ dimensionName: 'deviceCategory', reportID: DEVICES_BREAKDOWN_REPORT_ID },
] as const;

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

/**
 * One legend row for a breakdown donut: a segment label and its share of the
 * total, as a fraction between 0 and 1.
 */
export interface BreakdownRow {
	/** Name of the donut segment, like a channel, country, or device. */
	label: string;
	/** The segment's share of the total, as a fraction between 0 and 1. */
	percentage: number;
}

export interface AllTrafficPDFData {
	/** Loaded reports and breakdown legend rows, or `null` when the export is canceled. */
	data: {
		/** GA4 totals report with the current and comparison range totals. */
		totalsReport: Report;
		/** GA4 report with one row per day, which the line chart is drawn from. */
		graphReport: Report;
		/** Legend rows for the channels donut, or `null` on a missing report, empty data, or a failed render. */
		channelBreakdown: BreakdownRow[] | null;
		/** Legend rows for the locations donut, or `null` on a missing report, empty data, or a failed render. */
		locationBreakdown: BreakdownRow[] | null;
		/** Legend rows for the devices donut, or `null` on a missing report, empty data, or a failed render. */
		deviceBreakdown: BreakdownRow[] | null;
	} | null;
	/** Rendered chart images as JPEG data URIs. */
	chartImages?: {
		/** The All visitors line chart image. */
		lineChart: string;
		/** The channels donut image, absent when `channelBreakdown` is `null`. */
		channelChart?: string;
		/** The locations donut image, absent when `locationBreakdown` is `null`. */
		locationChart?: string;
		/** The devices donut image, absent when `deviceBreakdown` is `null`. */
		deviceChart?: string;
	};
}

interface LineChartPoint {
	/** Day the point covers, parsed from the row's date dimension. */
	date: Date;
	/** Total users on that day, `0` when the row has no value. */
	value: number;
}

interface BreakdownChart {
	/** Legend rows for the donut, or `null` on a missing report, empty data, or a failed render. */
	rows: BreakdownRow[] | null;
	/** The donut as a JPEG data URI, absent when `rows` is `null`. */
	chartImage?: string;
}

/**
 * Reduces the date-dimension graph report into parsed chart points.
 *
 * Rows whose date fails to parse are dropped, matching the dashboard's
 * tolerance for malformed dimension values.
 *
 * @since 1.182.0
 *
 * @param graphReport Date-dimension GA4 report.
 * @return Points of `{ date, value }`, ordered as returned.
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
 * @since 1.182.0
 *
 * @param points Parsed chart points.
 * @return A `google.visualization.DataTable` instance.
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
 * Builds Google Charts options matching the dashboard's All Visitors line chart.
 *
 * @since 1.182.0
 *
 * @param points Parsed chart points.
 * @return Google Charts options object.
 */
function getLineChartOptions( points: LineChartPoint[] ): object {
	// A tick per day, dropping the first so a tick sits at the range start,
	// matching the dashboard's `UserCountGraph`.
	const [ , ...ticks ] = points.map( ( { date } ) => date );

	const hasData = points.some( ( { value } ) => value > 0 );

	return {
		curveType: 'function',
		colors: [ LINE_CHART_COLOR ],
		chartArea: {
			left: 8,
			right: 40,
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
				fontSize: 14,
			},
			ticks,
		},
		vAxis: {
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
				fontSize: 14,
			},
			viewWindow: {
				min: 0,
				// Cap the empty-data axis so a flat zero line still reads well.
				...( hasData ? {} : { max: 100 } ),
			},
		},
		series: {
			0: {
				color: LINE_CHART_COLOR,
				lineWidth: 4,
				targetAxisIndex: 1,
			},
		},
		focusTarget: 'category',
	};
}

/**
 * Builds the Google Charts `DataTable` for one breakdown donut.
 *
 * One row per legend entry, with the segment label and its share of the total.
 * The shares are proportions, so the donut draws the same slices whether the
 * values are fractions or whole counts.
 *
 * @since 1.183.0
 *
 * @param rows Legend rows of `{ label, percentage }`.
 * @return A `google.visualization.DataTable` instance.
 */
function buildBreakdownChartDataTable( rows: BreakdownRow[] ): object {
	const visualization = getVisualization();
	if ( ! visualization?.DataTable ) {
		throw new Error(
			'Site Kit: Google Charts DataTable is unavailable after loading the library.'
		);
	}

	const dataTable = new visualization.DataTable();
	dataTable.addColumn( 'string', __( 'Source', 'google-site-kit' ) );
	dataTable.addColumn( 'number', __( 'Percent', 'google-site-kit' ) );
	dataTable.addRows(
		rows.map( ( { label, percentage } ) => [ label, percentage ] )
	);

	return dataTable;
}

/**
 * Builds Google Charts options for a breakdown donut.
 *
 * Uses the same hole size and colors as the dashboard's All Traffic donut, with
 * the slice labels, legend, and clicks removed, so the rendered image is a
 * clean donut.
 *
 * @since 1.183.0
 *
 * @return Google Charts options object.
 */
function getBreakdownChartOptions(): object {
	return {
		pieHole: BREAKDOWN_PIE_HOLE,
		colors: PIE_CHART_COLORS,
		// Google Charts draws a white border between slices by default. A
		// transparent border makes the segments touch.
		pieSliceBorderColor: 'transparent',
		// JPEG output has no transparency, so a transparent background turns
		// black. Fill it white to match the card behind the donut.
		backgroundColor: PDF_COLORS.SURFACES_SURFACE,
		chartArea: {
			left: 0,
			top: 0,
			width: '100%',
			height: '100%',
		},
		legend: {
			position: 'none',
		},
		pieSliceText: 'none',
		enableInteractivity: false,
	};
}

/**
 * Builds the legend rows and the donut image for one breakdown.
 *
 * Uses the dashboard's helper, so the slices and their order match the
 * dashboard: the top slices plus an "Others" slice. Returns `{ rows: null }`
 * on a missing report, empty data, or a failed or canceled render, so the
 * widget skips that tile while the other tiles render.
 *
 * @since 1.183.0
 *
 * @param report The breakdown report, or `null` when its fetch failed.
 * @param signal Cancellation signal forwarded to the renderer.
 * @return The breakdown's legend rows and donut image.
 */
async function loadBreakdownChart(
	report: Report | null,
	signal: AbortSignal
): Promise< BreakdownChart > {
	if ( ! report ) {
		return { rows: null };
	}

	try {
		const dataMap = extractAnalyticsDataForPieChart( report, {
			keyColumnIndex: 0,
			maxSlices: BREAKDOWN_MAX_SLICES,
			withOthers: true,
		} );

		// The first row is the header. The rest are `[ label, percentage ]`.
		const rows: BreakdownRow[] = dataMap
			.slice( 1 )
			.map( ( row: [ string, number ] ) => ( {
				label: row[ 0 ],
				percentage: row[ 1 ],
			} ) );

		if ( rows.length === 0 ) {
			return { rows: null };
		}

		const chartImage = await renderGoogleChartToDataURI( {
			chartType: 'PieChart',
			dataTable: buildBreakdownChartDataTable( rows ),
			options: getBreakdownChartOptions(),
			width: BREAKDOWN_CHART_SIZE,
			height: BREAKDOWN_CHART_SIZE,
			scaleFactor: BREAKDOWN_CHART_SCALE_FACTOR,
			signal,
		} );

		return { rows, chartImage };
	} catch {
		return { rows: null };
	}
}

/**
 * Loads the GA4 reports and chart images for the All Visitors PDF widget.
 *
 * Fetches the totals, graph, and three breakdown reports (channels, locations,
 * and devices) at the same time, and stops early when the signal is aborted.
 * Then it draws the line chart and the three donuts as JPEG data URIs for the
 * PDF. If one breakdown's report or render fails, the widget skips that tile
 * and the other tiles still render.
 *
 * @since 1.181.0
 * @since 1.183.0 Also loads the channel, location, and device breakdown donuts.
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @return Resolved report data and chart images.
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

	const breakdownArgsList = BREAKDOWNS.map( ( { dimensionName, reportID } ) =>
		getBreakdownReportArgs( {
			dimensionName,
			reportID,
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
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
			// the widget still renders and nothing renders for that tile.
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

	// Canceling during loading stops here, before any chart is drawn.
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
		signal,
	} );

	const [ channel, location, device ] = await Promise.all(
		breakdownReports.map( ( report ) =>
			loadBreakdownChart( report, signal )
		)
	);

	if ( signal.aborted ) {
		return { data: null };
	}

	return {
		data: {
			totalsReport,
			graphReport,
			channelBreakdown: channel.rows,
			locationBreakdown: location.rows,
			deviceBreakdown: device.rows,
		},
		chartImages: {
			lineChart,
			channelChart: channel.chartImage,
			locationChart: location.chartImage,
			deviceChart: device.chartImage,
		},
	};
}
