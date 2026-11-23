/**
 * Typical Traffic Overview PDF data loader.
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
import { isFeatureEnabled } from '@/js/features';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { TYPICAL_TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/typicalColumns';
import { TYPICAL_TRAFFIC_CHART_OPTIONS } from '@/js/modules/analytics-4/components/traffic-overview/charts/typicalTrafficChartOptions';
import { getTotalsReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import {
	getDailyVisitsReportArgs,
	getTypicalBreakdownReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/typicalReportOptions';
import {
	TrafficBreakdownRow,
	getBreakdownValuesFromReport,
	getMetricValue,
	getTrafficOverviewVisits,
	getTypicalBreakdownRows,
	hasTypicalTrafficRange,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import {
	BenchmarkingDailyTrafficRow,
	BenchmarkingInsight,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getDayCount, stringToDate } from '@/js/util';
import type { GetPDFDataParams } from './getPDFData';
import {
	TrafficOverviewTypicalTrafficPDFData,
	getTypicalTrafficPDFData,
} from './getTypicalTrafficPDFData';

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

/** A column of the typical traffic range: a bound of the band behind the line. */
const TYPICAL_TRAFFIC_RANGE_COLUMN = { type: 'number', role: 'interval' };

export interface TypicalTrafficOverviewPDFData {
	/** The figures, the daily traffic, the typical traffic view and the breakdown rows, or `null` when the export is canceled. */
	data: {
		/** The visits over the range, and over the range before it. A previous total of zero prints no change. */
		totalVisits: {
			/** The visits over the range. */
			current: number;
			/** The visits over the range before it. */
			previous?: number;
		};
		/** The unique visitors over the range, from the totals report. Zero when its request fails. */
		uniqueVisitors: number;
		/** The visits on each day of the range, oldest first, which the line chart is drawn from, with each day's typical range where the chart draws the band. A day without visits reads zero. */
		dailyTraffic: BenchmarkingDailyTrafficRow[];
		/** The parts of the typical traffic view, where the dashboard shows them: on the main dashboard, with the `typicalTraffic` feature and the benchmarking response. */
		typicalTraffic?: TrafficOverviewTypicalTrafficPDFData;
		/** Ranked rows for the channels breakdown, empty when no channel has visits. */
		channelBreakdown: TrafficBreakdownRow[];
		/** Ranked rows for the locations breakdown, empty when no location has visits. */
		locationBreakdown: TrafficBreakdownRow[];
		/** Ranked rows for the devices breakdown, empty when no device has visits. */
		deviceBreakdown: TrafficBreakdownRow[];
	} | null;
	/** Rendered chart images as JPEG data URIs. */
	chartImages?: {
		/** The visits line chart image. */
		lineChart: string;
	};
}

interface LineChartPoint {
	/** The day the point covers. */
	date: Date;
	/** The visits on that day. */
	value: number;
	/** The bounds of the day's typical range, where the day has one. */
	typicalRange?: {
		/** The lower bound. */
		min: number;
		/** The upper bound. */
		max: number;
	};
}

interface LineChartParts {
	/** Whether the chart draws the typical traffic range behind the line. */
	hasBand: boolean;
}

/**
 * Turns the daily traffic into the line chart's points.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} dailyTraffic The visits on each day, oldest first.
 * @return {Array<Object>} Points of `{ date, value, typicalRange }`, in the same order.
 */
function getLineChartPoints(
	dailyTraffic: BenchmarkingDailyTrafficRow[]
): LineChartPoint[] {
	return dailyTraffic.map(
		( { date, visits, expectedMin, expectedMax } ) => ( {
			date: stringToDate( date ),
			value: visits,
			typicalRange:
				expectedMin !== null && expectedMax !== null
					? { min: expectedMin, max: expectedMax }
					: undefined,
		} )
	);
}

/**
 * Builds the Google Charts `DataTable` for the visits line chart.
 *
 * The table has the "Day" and "Visits" columns of the dashboard chart's table,
 * which `getTypicalTrafficChartData()` builds, and the two interval columns of the
 * typical traffic range when the chart draws the band.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} points          Parsed chart points.
 * @param {Object}        options         The chart's parts.
 * @param {boolean}       options.hasBand Whether the chart draws the typical traffic range.
 * @return {Object} A `google.visualization.DataTable` instance.
 */
function buildLineChartDataTable(
	points: LineChartPoint[],
	{ hasBand }: LineChartParts
): object {
	const visualization = getVisualization();
	if ( ! visualization?.DataTable ) {
		throw new Error(
			'Site Kit: Google Charts DataTable is unavailable after loading the library.'
		);
	}

	const dataTable = new visualization.DataTable();
	dataTable.addColumn( 'date', __( 'Day', 'google-site-kit' ) );
	dataTable.addColumn( 'number', __( 'Visits', 'google-site-kit' ) );

	if ( hasBand ) {
		dataTable.addColumn( TYPICAL_TRAFFIC_RANGE_COLUMN );
		dataTable.addColumn( TYPICAL_TRAFFIC_RANGE_COLUMN );
	}

	dataTable.addRows(
		points.map( ( { date, value, typicalRange } ) =>
			hasBand
				? [
						date,
						value,
						typicalRange?.min ?? null,
						typicalRange?.max ?? null,
				  ]
				: [ date, value ]
		)
	);

	return dataTable;
}

/**
 * Builds Google Charts options matching the Traffic Overview card's line chart.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} points          Parsed chart points.
 * @param {Object}        options         The chart's parts.
 * @param {boolean}       options.hasBand Whether the chart draws the typical traffic range.
 * @return {Object} Google Charts options object.
 */
function getLineChartOptions(
	points: LineChartPoint[],
	{ hasBand }: LineChartParts
): object {
	const fontSize = 14;
	const chartAreaLeft = 8;
	// The band can reach above the busiest day, so the axis fits it too.
	const maxValue = points.reduce(
		( highest, { value, typicalRange } ) =>
			Math.max( highest, value, hasBand ? typicalRange?.max ?? 0 : 0 ),
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
		// The band behind the line, in the dashboard chart's color and opacity.
		...( hasBand
			? { intervals: TYPICAL_TRAFFIC_CHART_OPTIONS.intervals }
			: {} ),
		focusTarget: 'category',
	};
}

/**
 * Gets the generated insight the dashboard already has for the date range.
 *
 * Reading the insight before the dashboard has asked for it would ask the
 * Site Kit service to write one, and the export never waits for a
 * generation, so the PDF prints the insight only once its request has
 * finished.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry  WordPress data registry.
 * @param {string} startDate The first day of the date range.
 * @param {string} endDate   The last day of the date range.
 * @return {(Object|null)} The insight, or null when the dashboard has none.
 */
function getLoadedInsight(
	registry: GetPDFDataParams[ 'registry' ],
	startDate: string,
	endDate: string
): BenchmarkingInsight | null {
	const { hasFinishedResolution, getBenchmarkingInsight } =
		registry.select( MODULES_ANALYTICS_4 );

	if (
		! isFeatureEnabled( 'trafficInsights' ) ||
		! hasFinishedResolution( 'getBenchmarkingInsight', [
			startDate,
			endDate,
		] )
	) {
		return null;
	}

	return getBenchmarkingInsight( startDate, endDate ) ?? null;
}

/**
 * Gets the parts of the typical traffic view the PDF prints, where the
 * dashboard shows them.
 *
 * The dashboard leaves the key factors out while the property gathers data,
 * so the PDF does too. The check reads the state only once the dashboard has
 * resolved it, so the export sends no request for it.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry             WordPress data registry.
 * @param {Object} benchmarkingResponse The benchmarking response for the date range.
 * @param {Object} dates                The date range.
 * @param {string} dates.startDate      The first day of the date range.
 * @param {string} dates.endDate        The last day of the date range.
 * @return {(Object|undefined)} The parts of the typical traffic view, or `undefined` while the property gathers data.
 */
function getTypicalTraffic(
	registry: GetPDFDataParams[ 'registry' ],
	benchmarkingResponse: DecodedBenchmarkingResponse,
	{ startDate, endDate }: { startDate: string; endDate: string }
): TrafficOverviewTypicalTrafficPDFData | undefined {
	const { hasFinishedResolution, isGatheringData } =
		registry.select( MODULES_ANALYTICS_4 );

	if ( hasFinishedResolution( 'isGatheringData' ) && isGatheringData() ) {
		return undefined;
	}

	return getTypicalTrafficPDFData( {
		benchmarkingResponse,
		insight: getLoadedInsight( registry, startDate, endDate ),
		referenceDate: registry.select( CORE_USER ).getReferenceDate(),
		referenceSiteURL:
			registry.select( CORE_SITE ).getReferenceSiteURL() || undefined,
		daysInRange: getDayCount( startDate, endDate ),
	} );
}

/**
 * Loads the figures, the typical traffic view and the line chart image for
 * the Typical Traffic Overview PDF section.
 *
 * On the main dashboard, the PDF reads the benchmarking response as the
 * dashboard does, so it prints the dashboard's visits, band, key factors and
 * the generated insight the dashboard already has. On the entity dashboard,
 * or when the benchmarking request fails, the visits come from the daily visits report
 * over the range and the range before it, as on the dashboard. The unique
 * visitors come from the totals report, and the three breakdowns from their
 * reports, with the entity URL on an entity dashboard. The run stops early
 * when the signal is aborted. Then it draws the line chart of the visits on
 * each day as a JPEG data URI for the PDF. The daily traffic and the rows of
 * each breakdown are shaped with the same helpers the dashboard uses, so the
 * printed figures always match.
 *
 * A report that fails reads as a report without rows, so the rest of the
 * section still prints.
 *
 * @since n.e.x.t
 *
 * @param {Object}      params          Loader parameters.
 * @param {Object}      params.registry WordPress data registry.
 * @param {Object}      params.dates    Report date range.
 * @param {AbortSignal} params.signal   Cancellation signal.
 * @return {Object} Resolved report data and chart images.
 */
export default async function getTypicalTrafficOverviewPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< TypicalTrafficOverviewPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const { startDate, endDate, compareStartDate, compareEndDate } = dates;

	const url = registry.select( CORE_SITE ).getCurrentEntityURL() || undefined;

	// The dashboard reads its figures from the benchmarking response only on
	// the main dashboard.
	const readsBenchmarkingResponse = ! url;

	const totalsArgs = getTotalsReportArgs( {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		url,
	} );

	// The range before the selected one gives the visits the change compares
	// with, as on the main dashboard.
	const dailyVisitsArgs = getDailyVisitsReportArgs( {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		url,
	} );

	// In the order of `TYPICAL_TRAFFIC_BREAKDOWN_COLUMNS`: channels, locations, devices.
	const breakdownArgsList = TYPICAL_TRAFFIC_BREAKDOWN_COLUMNS.map(
		( { dimensionName, reportID } ) =>
			getTypicalBreakdownReportArgs( {
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
	[ totalsArgs, dailyVisitsArgs, ...breakdownArgsList ].forEach( ( args ) =>
		invalidateResolution( 'getReport', [ args, { signal } ] )
	);

	// A report that fails resolves to `undefined`, which reads as no rows.
	function resolveReport(
		args: ReportOptions
	): Promise< Report | undefined > {
		return registry
			.resolveSelect( MODULES_ANALYTICS_4 )
			.getReport( args, { signal } );
	}

	const reportsRequest = Promise.all(
		[ totalsArgs, ...breakdownArgsList ].map( resolveReport )
	);

	// A failed request leaves no response, as on the dashboard.
	const benchmarkingResponse: DecodedBenchmarkingResponse | undefined =
		readsBenchmarkingResponse
			? await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( startDate, endDate )
			: undefined;

	// Without the benchmarking response, the visits come from the daily visits
	// report. With it, the PDF asks for no report the dashboard didn't.
	const dailyVisitsReport = benchmarkingResponse
		? undefined
		: await resolveReport( dailyVisitsArgs );

	const [ totalsReport, channelsReport, locationsReport, devicesReport ] =
		await reportsRequest;

	if ( signal.aborted ) {
		return { data: null };
	}

	await ensureGoogleChartsLoaded();

	// Canceling during loading stops here, before the chart is drawn.
	if ( signal.aborted ) {
		return { data: null };
	}

	const { dailyTraffic = [], totalVisits = { current: 0 } } =
		getTrafficOverviewVisits( {
			benchmarkingResponse,
			benchmarkingFailed: ! benchmarkingResponse,
			dailyVisitsReport,
			startDate,
			endDate,
		} );

	// The band covers every day of the range or none of them.
	const hasBand = hasTypicalTrafficRange( dailyTraffic );
	const points = getLineChartPoints( dailyTraffic );

	const lineChart = await renderGoogleChartToDataURI( {
		chartType: 'LineChart',
		dataTable: buildLineChartDataTable( points, { hasBand } ),
		options: getLineChartOptions( points, { hasBand } ),
		width: LINE_CHART_WIDTH,
		height: LINE_CHART_HEIGHT,
		scaleFactor: LINE_CHART_SCALE_FACTOR,
		signal,
	} );

	if ( signal.aborted ) {
		return { data: null };
	}

	return {
		data: {
			totalVisits,
			// The report's totals hold the selected range first.
			uniqueVisitors: getMetricValue( totalsReport?.totals?.[ 0 ] ),
			dailyTraffic,
			typicalTraffic: benchmarkingResponse
				? getTypicalTraffic( registry, benchmarkingResponse, {
						startDate,
						endDate,
				  } )
				: undefined,
			channelBreakdown: getTypicalBreakdownRows(
				getBreakdownValuesFromReport( channelsReport )
			),
			locationBreakdown: getTypicalBreakdownRows(
				getBreakdownValuesFromReport( locationsReport )
			),
			deviceBreakdown: getTypicalBreakdownRows(
				getBreakdownValuesFromReport( devicesReport )
			),
		},
		chartImages: {
			lineChart,
		},
	};
}
