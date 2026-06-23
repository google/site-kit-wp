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
import { PIE_CHART_COLORS } from '@/js/components/pdf-export/pie-chart-colors';
import renderGoogleChartToDataURI, {
	getVisualization,
} from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import type {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { extractAnalyticsDataForPieChart } from '@/js/modules/analytics-4/utils/chart';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import {
	CHANNELS_BREAKDOWN_REPORT_ID,
	DEVICES_BREAKDOWN_REPORT_ID,
	getBreakdownReportArgs,
	getGraphReportArgs,
	getTotalsReportArgs,
	LOCATIONS_BREAKDOWN_REPORT_ID,
} from './reportOptions';

// Matches the dashboard's All Visitors line colour (the default graph colour).
const LINE_CHART_COLOR = '#3c7251';
const LINE_CHART_WIDTH = 540;
const LINE_CHART_HEIGHT = 200;

// Matches the dashboard's All Traffic donut hole.
const BREAKDOWN_PIE_HOLE = 0.6;
// Square render size, in PDF points, for each breakdown donut.
const BREAKDOWN_CHART_SIZE = 72.85;
// Top slices kept per breakdown before the rest roll into one "Others" slice,
// matching the dashboard's All Traffic pie.
const BREAKDOWN_MAX_SLICES = 5;

// The three GA4 breakdowns shown below the line chart, in render order. Each
// pairs the dashboard's dimension with a distinct report ID, so the three
// reports resolve and cache independently.
const BREAKDOWNS = [
	{
		dimensionName: 'sessionDefaultChannelGrouping',
		reportID: CHANNELS_BREAKDOWN_REPORT_ID,
	},
	{ dimensionName: 'country', reportID: LOCATIONS_BREAKDOWN_REPORT_ID },
	{ dimensionName: 'deviceCategory', reportID: DEVICES_BREAKDOWN_REPORT_ID },
] as const;

export interface GetPDFDataParams {
	registry: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry actions are loosely typed in this codebase.
		dispatch: ( storeName: string ) => any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry selectors are loosely typed in this codebase.
		resolveSelect: ( storeName: string ) => any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry selectors are loosely typed in this codebase.
		select: ( storeName: string ) => any;
	};
	dates: Pick<
		ReportOptions,
		'startDate' | 'endDate' | 'compareStartDate' | 'compareEndDate'
	>;
	signal: AbortSignal;
}

/**
 * One legend row for a breakdown donut: a segment label and its share of the
 * total, as a fraction between 0 and 1.
 */
export interface BreakdownRow {
	label: string;
	percentage: number;
}

export interface AllTrafficPDFData {
	data: {
		totalsReport: Report;
		graphReport: Report;
		channelBreakdown: BreakdownRow[] | null;
		locationBreakdown: BreakdownRow[] | null;
		deviceBreakdown: BreakdownRow[] | null;
	} | null;
	chartImages?: {
		lineChart: string;
		channelChart?: string;
		locationChart?: string;
		deviceChart?: string;
	};
}

interface LineChartPoint {
	date: Date;
	value: number;
}

interface BreakdownChart {
	rows: BreakdownRow[] | null;
	chartImage?: string;
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
 * Builds Google Charts options matching the dashboard's All Visitors line chart.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} points Parsed chart points.
 * @return {Object} Google Charts options object.
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
			// Result of placing `rgba(26, 115, 232, 0.08)` over a white background.
			backgroundColor: '#eef4fd',
			format: 'MMM d',
			gridlines: {
				color: '#ffffff',
			},
			textPosition: 'out',
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
			ticks,
		},
		vAxis: {
			gridlines: {
				color: '#ece9f1',
			},
			lineWidth: 3,
			minorGridlines: {
				color: '#ffffff',
			},
			minValue: 0,
			textPosition: 'out',
			textStyle: {
				color: '#616161',
				fontSize: 12,
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
				lineWidth: 3,
				targetAxisIndex: 1,
			},
		},
		focusTarget: 'category',
	};
}

/**
 * Builds the Google Charts `DataTable` for one breakdown donut.
 *
 * One row per legend entry: the segment label and its share of the total. The
 * shares are relative, so the donut draws the same slices whether the values
 * are fractions or raw counts.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} rows Legend rows of `{ label, percentage }`.
 * @return {Object} A `google.visualization.DataTable` instance.
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
 * Mirrors the dashboard's All Traffic donut: the same hole size and the shared
 * color palette, with the slice labels, legend, and interactivity stripped so
 * the rasterised image is a clean donut.
 *
 * @since n.e.x.t
 *
 * @return {Object} Google Charts options object.
 */
function getBreakdownChartOptions(): object {
	return {
		pieHole: BREAKDOWN_PIE_HOLE,
		colors: PIE_CHART_COLORS,
		// JPEG output has no transparency, so a transparent background renders
		// black. Fill it white to match the card behind the donut.
		backgroundColor: '#ffffff',
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
 * Builds the legend rows and rasterised donut for one breakdown.
 *
 * Collapses the report to the top slices plus an "Others" slice with the
 * dashboard's own helper, so the slices and their order match the dashboard.
 * Each breakdown is isolated: a missing report, empty data, or a failed render
 * resolves to `{ rows: null }` so the component shows its "Data unavailable"
 * placeholder for that tile while the others still render. An abort raised
 * mid-render is swallowed here too, and the caller re-checks the signal after
 * all breakdowns settle, so cancelling still ends the export.
 *
 * @since n.e.x.t
 *
 * @param {Object|null} report The breakdown report, or `null` when its fetch failed.
 * @param {Object}      signal Cancellation signal forwarded to the renderer.
 * @return {Promise<Object>} The breakdown's legend rows and donut image.
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

		// The first row is the header; the rest are `[ label, percentage ]`.
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
			signal,
		} );

		return { rows, chartImage };
	} catch {
		return { rows: null };
	}
}

/**
 * Loads the GA4 reports and rasterised charts for the All Visitors PDF widget.
 *
 * Resolves the totals, date-dimension graph, and three breakdown reports
 * (channels, locations, devices) in parallel via the registry, stopping early
 * between awaits when the supplied signal is aborted. Forwards the signal to
 * each report request, so cancelling the export also stops any request that is
 * still running. Invalidates the resolutions left by earlier runs, so a rerun
 * after a cancelled or failed export fetches the reports again. Once the
 * reports resolve it loads Google Charts offscreen and rasterises the All
 * Visitors line chart and the three breakdown donuts to JPEG data URIs for
 * embedding in the PDF. Each breakdown is isolated: its tile falls back to a
 * placeholder when its report or render fails, while the rest still render.
 *
 * @since 1.181.0
 * @since n.e.x.t Also loads the channel, location, and device breakdown donuts.
 *
 * @param {Object}      params          Loader parameters.
 * @param {Object}      params.registry WordPress data registry.
 * @param {Object}      params.dates    Report date range.
 * @param {AbortSignal} params.signal   Cancellation signal.
 * @return {Promise<Object>} Resolved report data and chart images.
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
	// every abort signal looks the same to it. After a cancelled or failed
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
			// A breakdown report that fails is caught here, so the rest of the
			// widget still renders and that one tile falls back to its
			// placeholder.
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

	// Cancelling during loading stops here, before any chart is rasterised.
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
		breakdownReports.map( ( report ) => loadBreakdownChart( report, signal ) )
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
