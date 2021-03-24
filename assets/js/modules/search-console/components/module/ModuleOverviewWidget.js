/**
 * ModuleOverviewWidget component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { Fragment, useState, useCallback } from '@wordpress/element';
import { __, sprintf, _n, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { decodeHTMLEntity, getCurrentDateRangeDayCount } from '../../../../util';
import {
	extractSearchConsoleDashboardData,
	getSiteStatsDataForGoogleChart,
	generateDateRangeArgs,
	isZeroReport,
} from '../../util';
import WidgetHeaderTitle from '../../../../googlesitekit/widgets/components/WidgetHeaderTitle';
import WidgetHeaderCTA from '../../../../googlesitekit/widgets/components/WidgetHeaderCTA';
import { Grid, Row, Cell } from '../../../../material-components';
import PreviewBlock from '../../../../components/PreviewBlock';
import GoogleChart from '../../../../components/GoogleChart';
import DataBlock from '../../../../components/DataBlock';
import Data from 'googlesitekit-data';
const { useSelect } = Data;

const ModuleOverviewWidget = ( { Widget, WidgetReportZero, WidgetReportError } ) => {
	const [ selectedStats, setSelectedStats ] = useState( 0 );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const { startDate, endDate, compareStartDate } = useSelect(
		( select ) => select( CORE_USER ).getDateRangeDates(
			{
				compare: true,
				offsetDays: DATE_RANGE_OFFSET,
			}
		)
	);
	const reportArgs = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
	};
	const data = useSelect( ( select ) => select( STORE_NAME ).getReport( reportArgs ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ reportArgs ] ) );
	const loading = useSelect( ( select ) => ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ reportArgs ] ) );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const currentEntityTitle = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityTitle() );
	const searchConsoleDeepArgs = {
		resource_id: propertyID,
		...generateDateRangeArgs( { startDate, endDate } ),
	};
	const searchConsoleDeepLink = useSelect( ( select ) => select( STORE_NAME ).getServiceURL( {
		path: '/performance/search-analytics',
		query: searchConsoleDeepArgs,
	} ) );

	const handleStatSelection = useCallback( ( stat ) => {
		setSelectedStats( stat );
	}, [] );

	if ( loading ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="search-console" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <WidgetReportZero moduleSlug="search-console" />;
	}

	const metrics = [
		{
			color: '#4285f4',
			label: __( 'Clicks', 'google-site-kit' ),
			metric: 'clicks',
		},
		{
			color: '#27bcd4',
			label: __( 'Impressions', 'google-site-kit' ),
			metric: 'impressions',
		},
		{
			color: '#1b9688',
			label: __( 'CTR', 'google-site-kit' ),
			metric: 'ctr',
		},
		{
			color: '#673ab7',
			label: __( 'Position', 'google-site-kit' ),
			metric: 'position',
		},
	];

	const processedData = extractSearchConsoleDashboardData( data );
	const {
		totalClicks,
		totalImpressions,
		averageCTR,
		averagePosition,
		totalClicksChange,
		totalImpressionsChange,
		averageCTRChange,
		averagePositionChange,
	} = processedData;

	const dataBlocks = [
		{
			className: 'googlesitekit-data-block--clicks googlesitekit-data-block--button-1',
			title: __( 'Total Clicks', 'google-site-kit' ),
			datapoint: totalClicks,
			change: totalClicksChange,
			changeDataUnit: '%',
			context: 'button',
			selected: selectedStats === 0,
			handleStatSelection,
		},
		{
			className: 'googlesitekit-data-block--impressions googlesitekit-data-block--button-2',
			title: __( 'Total Impressions', 'google-site-kit' ),
			datapoint: totalImpressions,
			change: totalImpressionsChange,
			changeDataUnit: '%',
			context: 'button',
			selected: selectedStats === 1,
			handleStatSelection,
		},
		{
			className: 'googlesitekit-data-block--ctr googlesitekit-data-block--button-3',
			title: __( 'Average CTR', 'google-site-kit' ),
			datapoint: averageCTR,
			datapointUnit: '%',
			change: averageCTRChange,
			changeDataUnit: '%',
			context: 'button',
			selected: selectedStats === 2,
			handleStatSelection,
		},
		{
			className: 'googlesitekit-data-block--position googlesitekit-data-block--button-4',
			title: __( 'Average Position', 'google-site-kit' ),
			datapoint: averagePosition,
			change: averagePositionChange,
			changeDataUnit: '%',
			context: 'button',
			selected: selectedStats === 3,
			handleStatSelection,
		},
	];

	let title = __( 'Search Traffic Summary', 'google-site-kit' );
	if ( currentEntityTitle ) {
		/* translators: %s: page title */
		title = sprintf( __( 'Search Traffic Summary for %s', 'google-site-kit' ), decodeHTMLEntity( currentEntityTitle ) );
	}

	const options = {
		chart: {
			title,
		},
		curveType: 'line',
		height: 270,
		width: '100%',
		chartArea: {
			height: '77%',
			left: 60,
			width: '100%',
		},
		legend: {
			position: 'top',
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
		},
		hAxis: {
			format: 'M/d/yy',
			gridlines: {
				color: '#fff',
			},
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
		},
		vAxis: {
			direction: selectedStats === 3 ? -1 : 1,
			gridlines: {
				color: '#eee',
			},
			minorGridlines: {
				color: '#eee',
			},
			textStyle: {
				color: '#616161',
				fontSize: 12,
			},
			titleTextStyle: {
				color: '#616161',
				fontSize: 12,
				italic: false,
			},
		},
		series: {
			0: {
				color: metrics[ selectedStats ].color,
				targetAxisIndex: 0,
			},
			1: {
				color: metrics[ selectedStats ].color,
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		},
		tooltip: {
			isHtml: true, // eslint-disable-line sitekit/acronym-case
			trigger: 'both',
		},
		focusTarget: 'category',
	};

	// Split the data in two chunks.
	const half = Math.floor( data.length / 2 );
	const latestData = data.slice( half );
	const olderData = data.slice( 0, half );

	const googleChartData = getSiteStatsDataForGoogleChart(
		latestData,
		olderData,
		metrics[ selectedStats ].label,
		metrics[ selectedStats ].metric,
	);

	const currentDayCount = getCurrentDateRangeDayCount( dateRange );

	return (
		<Widget
			noPadding
			Header={ () => (
				<Fragment>
					<WidgetHeaderTitle
						title={ sprintf(
							/* translators: %s: number of days */
							_n( 'Overview for the last %s day', 'Overview for the last %s days', currentDayCount, 'google-site-kit', ),
							currentDayCount,
						) }
					/>
					<WidgetHeaderCTA
						href={ searchConsoleDeepLink }
						label={ sprintf(
							/* translators: %s: module name. */
							__( 'See full stats in %s', 'google-site-kit' ),
							_x( 'Search Console', 'Service name', 'google-site-kit' )
						) }
					/>
				</Fragment>
			) }
		>
			<Grid>
				<Row
					role="toolbar"
					aria-label="Line Chart Options"
				>
					{ dataBlocks.map( ( block, i ) => (
						<Cell
							key={ i }
							smSize={ 2 }
							mdSize={ 2 }
							lgSize={ 3 }
						>
							<DataBlock
								stat={ i }
								className={ block.className }
								title={ block.title }
								datapoint={ block.datapoint }
								datapointUnit={ block.datapointUnit }
								change={ block.change }
								changeDataUnit={ block.changeDataUnit }
								context={ block.context }
								selected={ block.selected }
								handleStatSelection={ block.handleStatSelection }
							/>
						</Cell>
					) ) }
				</Row>
			</Grid>

			<Grid className="googlesitekit-search-console-site-stats">
				<Row>
					<Cell size={ 12 }>
						<GoogleChart
							chartType="line"
							selectedStats={ [ selectedStats ] }
							data={ googleChartData }
							options={ options }
						/>
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
};

export default ModuleOverviewWidget;
