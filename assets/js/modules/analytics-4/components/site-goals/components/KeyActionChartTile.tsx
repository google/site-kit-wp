/**
 * Site Goals Key action chart tile.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import GoogleChart from '@/js/components/GoogleChart';
import PreviewBlock from '@/js/components/PreviewBlock';
import ReportError from '@/js/components/ReportError';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import getKeyActionChartReportOptions, {
	KeyActionChartReportArgs,
} from './getKeyActionChartReportOptions';
import GoalTile from './GoalTile';
import ZeroDataMessage from './ZeroDataMessage';

/** The area under the line, from the `$c-blue-b-50` Sass variable. */
const CHART_AREA_COLOR = '#dce8ff';

/** The line, from the `$c-blue-b-300` Sass variable. */
const CHART_LINE_COLOR = '#7f9cd4';

const CHART_HEIGHT = 48;

/** Leaves room above the line, so its highest point stays inside the chart. */
const CHART_TOP_PADDING = 4;

/**
 * `CHART_OPTIONS` hides the legend and the tooltip, so nothing shows these
 * labels. They need no translation.
 */
const CHART_COLUMNS = [
	{ type: 'date', label: 'Day' },
	{ type: 'number', label: 'Events' },
	{ type: 'number', label: 'Events' },
];

const CHART_OPTIONS = {
	backgroundColor: 'transparent',
	chartArea: {
		height: CHART_HEIGHT - CHART_TOP_PADDING,
		left: 0,
		top: CHART_TOP_PADDING,
		width: '100%',
	},
	enableInteractivity: false,
	hAxis: {
		baselineColor: 'none',
		ticks: [],
	},
	height: CHART_HEIGHT,
	legend: { position: 'none' },
	series: {
		// Google Charts gives each series one color, so the area under the
		// line and the line over it are two series.
		0: {
			areaOpacity: 1,
			color: CHART_AREA_COLOR,
			lineWidth: 0,
		},
		1: {
			areaOpacity: 0,
			color: CHART_LINE_COLOR,
			lineWidth: 3,
		},
	},
	vAxis: {
		baselineColor: 'none',
		ticks: [],
		viewWindow: { min: 0 },
	},
	width: '100%',
};

export interface KeyActionChartTileProps extends KeyActionChartReportArgs {
	/** The title above the chart, such as `Total sales in the last 28 days`. */
	title: string;
}

const KeyActionChartTile: FC< KeyActionChartTileProps > = ( {
	title,
	dates,
	eventNames,
	goalType,
	breakdownFilter,
} ) => {
	const { startDate, endDate } = dates;

	const reportOptions = useMemo(
		() =>
			getKeyActionChartReportOptions( {
				dates: { startDate, endDate },
				eventNames,
				goalType,
				breakdownFilter,
			} ),
		[ breakdownFilter, endDate, eventNames, goalType, startDate ]
	);

	const report = useInViewSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
		[ reportOptions ]
	) as Report | undefined;

	const [ loading, error ] = useSelect(
		( select: Select ) => [
			select( MODULES_ANALYTICS_4 ).areReportsLoading( reportOptions ),
			select( MODULES_ANALYTICS_4 ).getFirstReportError( reportOptions ),
		],
		[ reportOptions ]
	);

	const dataPoints = ( report?.rows ?? [] ).map(
		( { dimensionValues, metricValues } ) => ( {
			date: parseDimensionStringToDate(
				dimensionValues?.[ 0 ]?.value ?? ''
			),
			count: parseInt( metricValues?.[ 0 ]?.value ?? '', 10 ) || 0,
		} )
	);

	const hasEvents = dataPoints.some( ( { count } ) => count > 0 );

	/**
	 * `CHART_OPTIONS` draws the area and the line as two series, so every row
	 * holds its count twice.
	 */
	const chartData = [
		CHART_COLUMNS,
		...dataPoints.map( ( { date, count } ) => [ date, count, count ] ),
	];

	return (
		<GoalTile
			baseClassName="googlesitekit-site-goals-tile"
			className="googlesitekit-site-goals-tile--chart"
			title={ title }
			bodyClassName="googlesitekit-site-goals-tile__chart"
		>
			{ loading && (
				<div className="googlesitekit-site-goals-tile__loading">
					<PreviewBlock
						width="100%"
						height={ `${ CHART_HEIGHT }px` }
					/>
				</div>
			) }

			{ ! loading && !! error && (
				<div className="googlesitekit-site-goals-tile__error">
					<ReportError moduleSlug="analytics-4" error={ error } />
				</div>
			) }

			{ ! loading && ! error && ! hasEvents && (
				<div className="googlesitekit-site-goals-tile__zero-state">
					<ZeroDataMessage
						metricLabel={
							goalType === GOAL_TYPES.ECOMMERCE
								? 'sales'
								: 'leads'
						}
					/>
				</div>
			) }

			{ ! loading && ! error && hasEvents && (
				<GoogleChart
					chartType="AreaChart"
					data={ chartData }
					height={ `${ CHART_HEIGHT }px` }
					options={ CHART_OPTIONS }
					width="100%"
				/>
			) }
		</GoalTile>
	);
};

export default KeyActionChartTile;
