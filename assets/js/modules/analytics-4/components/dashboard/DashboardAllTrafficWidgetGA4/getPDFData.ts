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
import renderGoogleChartToDataURI, {
	getVisualization,
} from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import type {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import { getGraphReportArgs, getTotalsReportArgs } from './reportOptions';

// Matches the dashboard's All Visitors line colour (the default graph colour).
const LINE_CHART_COLOR = '#3c7251';
const LINE_CHART_WIDTH = 540;
const LINE_CHART_HEIGHT = 200;

export interface GetPDFDataParams {
	registry: {
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

export interface AllTrafficPDFData {
	data: {
		totalsReport: Report;
		graphReport: Report;
	} | null;
	chartImages?: {
		lineChart: string;
	};
}

interface LineChartPoint {
	date: Date;
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
 * Loads the GA4 reports and rasterised line chart for the All Visitors PDF widget.
 *
 * Resolves the totals and date-dimension graph reports in parallel via the
 * registry, short-circuiting between awaits if the supplied signal is aborted.
 * Once the reports resolve it loads Google Charts offscreen and rasterises the
 * All Visitors line chart to a JPEG data URI for embedding in the PDF.
 *
 * @since n.e.x.t
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

	const [ totalsReport, graphReport ] = await Promise.all( [
		registry.resolveSelect( MODULES_ANALYTICS_4 ).getReport( totalsArgs ),
		registry.resolveSelect( MODULES_ANALYTICS_4 ).getReport( graphArgs ),
	] );

	if ( signal.aborted ) {
		return { data: null };
	}

	await ensureGoogleChartsLoaded();

	const points = getLineChartPoints( graphReport );

	const lineChart = await renderGoogleChartToDataURI( {
		chartType: 'LineChart',
		dataTable: buildLineChartDataTable( points ),
		options: getLineChartOptions( points ),
		width: LINE_CHART_WIDTH,
		height: LINE_CHART_HEIGHT,
		signal,
	} );

	return {
		data: {
			totalsReport,
			graphReport,
		},
		chartImages: {
			lineChart,
		},
	};
}
