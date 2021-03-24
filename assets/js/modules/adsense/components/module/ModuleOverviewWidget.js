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
import { calculateChange } from '../../../../util';
import { getSiteStatsDataForGoogleChart, isZeroReport } from '../../util';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
import WidgetHeaderTitle from '../../../../googlesitekit/widgets/components/WidgetHeaderTitle';
import WidgetHeaderCTA from '../../../../googlesitekit/widgets/components/WidgetHeaderCTA';
import { Grid, Row, Cell } from '../../../../material-components';
import PreviewBlock from '../../../../components/PreviewBlock';
import GoogleChart from '../../../../components/GoogleChart';
import DataBlock from '../../../../components/DataBlock';
import Data from 'googlesitekit-data';
const { useSelect } = Data;

const ModuleOverviewWidget = ( { Widget, WidgetReportZero, WidgetReportError } ) => {
	const metrics = {
		EARNINGS: __( 'Earnings', 'google-site-kit' ),
		PAGE_VIEWS_RPM: __( 'Page RPM', 'google-site-kit' ),
		IMPRESSIONS: __( 'Impressions', 'google-site-kit' ),
		PAGE_VIEWS_CTR: __( 'Page CTR', 'google-site-kit' ),
	};
	const [ selectedStats, setSelectedStats ] = useState( 0 );

	const {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
	} = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { compare: true } ) );
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} ) );
	const accountSiteURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( generateDateRangeArgs( dateRangeDates ) ) );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const currentDayCount = getCurrentDateRangeDayCount( dateRange );

	const currentRangeArgs = {
		metrics: Object.keys( metrics ),
		startDate,
		endDate,
	};
	const previousRangeArgs = {
		metrics: Object.keys( metrics ),
		startDate: compareStartDate,
		endDate: compareEndDate,
	};
	const currentRangeChartArgs = {
		...currentRangeArgs,
		dimensions: [ 'DATE' ],
	};
	const previousRangeChartArgs = {
		...previousRangeArgs,
		dimensions: [ 'DATE' ],
	};

	const currentRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( currentRangeArgs ) );
	const previousRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( previousRangeArgs ) );
	const currentRangeChartData = useSelect( ( select ) => select( STORE_NAME ).getReport( currentRangeChartArgs ) );
	const previousRangeChartData = useSelect( ( select ) => select( STORE_NAME ).getReport( previousRangeChartArgs ) );

	const currentRangeLoading = useSelect( ( select ) => ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ currentRangeArgs ] ) );
	const previousRangeLoading = useSelect( ( select ) => ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ previousRangeArgs ] ) );
	const currentRangeChartLoading = useSelect( ( select ) => ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ currentRangeChartArgs ] ) );
	const previousRangeChartLoading = useSelect( ( select ) => ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ previousRangeChartArgs ] ) );

	const currentRangeError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ) );
	const previousRangeError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ previousRangeArgs ] ) );
	const currentRangeChartError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeChartArgs ] ) );
	const previousRangeChartError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ previousRangeChartArgs ] ) );

	const handleStatSelection = useCallback( ( stat ) => {
		setSelectedStats( stat );
	}, [] );

	if ( currentRangeLoading || previousRangeLoading || currentRangeChartLoading || previousRangeChartLoading ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( currentRangeError || previousRangeError || currentRangeChartError || previousRangeChartError ) {
		return (
			<WidgetReportError
				moduleSlug="adsense"
				error={ currentRangeError || previousRangeError || currentRangeChartError || previousRangeChartError }
			/>
		);
	}

	if ( isZeroReport( currentRangeData ) ) {
		return <WidgetReportZero moduleSlug="adsense" />;
	}

	const { totals, headers } = currentRangeData;
	const { totals: previousTotals } = previousRangeData;

	const dataBlocks = [
		{
			className: 'googlesitekit-data-block--page-rpm googlesitekit-data-block--button-1',
			title: metrics[ headers[ 0 ].name ],
			datapoint: totals[ 0 ],
			datapointUnit: headers[ 0 ]?.currency,
			change: calculateChange( previousTotals[ 0 ], totals[ 0 ] ),
			changeDataUnit: '%',
			context: 'button',
			selected: selectedStats === 0,
			handleStatSelection,
		},
		{
			className: 'googlesitekit-data-block--page-rpm googlesitekit-data-block--button-2',
			title: metrics[ headers[ 1 ].name ],
			datapoint: totals[ 1 ],
			datapointUnit: headers[ 1 ]?.currency,
			change: calculateChange( previousTotals[ 1 ], totals[ 1 ] ),
			changeDataUnit: '%',
			context: 'button',
			selected: selectedStats === 1,
			handleStatSelection,
		},
		{
			className: 'googlesitekit-data-block--impression googlesitekit-data-block--button-3',
			title: metrics[ headers[ 2 ].name ],
			datapoint: totals[ 2 ],
			change: calculateChange( previousTotals[ 2 ], totals[ 2 ] ),
			changeDataUnit: '%',
			context: 'button',
			selected: selectedStats === 2,
			handleStatSelection,
		},
		{
			className: 'googlesitekit-data-block--impression googlesitekit-data-block--button-4',
			title: metrics[ headers[ 3 ].name ],
			datapoint: totals[ 3 ],
			datapointUnit: '%',
			change: calculateChange( previousTotals[ 3 ], totals[ 3 ] ),
			changeDataUnit: '%',
			context: 'button',
			selected: selectedStats === 3,
			handleStatSelection,
		},
	];

	const colors = [
		'#4285f4',
		'#27bcd4',
		'#1b9688',
		'#673ab7',
	];

	const formats = {
		METRIC_TALLY: undefined,
		METRIC_CURRENCY: 'currency',
		METRIC_RATIO: 'percent',
		METRIC_DECIMAL: 'decimal',
		METRIC_MILLISECONDS: undefined,
	};

	const options = {
		curveType: 'line',
		height: 270,
		width: '100%',
		chartArea: {
			height: '80%',
			width: '87%',
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
			format: formats[ currentRangeChartData.headers[ selectedStats + 1 ].type ],
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
		focusTarget: 'category',
		crosshair: {
			color: 'gray',
			opacity: 0.1,
			orientation: 'vertical',
			trigger: 'both',
		},
		tooltip: {
			isHtml: true, // eslint-disable-line sitekit/acronym-case
			trigger: 'both',
		},
		series: {
			0: {
				color: colors[ selectedStats ],
				targetAxisIndex: 0,
			},
			1: {
				color: colors[ selectedStats ],
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		},
	};

	const dataMap = getSiteStatsDataForGoogleChart(
		currentRangeChartData,
		previousRangeChartData,
		Object.values( metrics )[ selectedStats ],
		selectedStats + 1,
		currentRangeChartData.headers[ selectedStats + 1 ],
	);

	return (
		<Widget
			noPadding
			Header={ () => (
				<Fragment>
					<WidgetHeaderTitle
						title={ sprintf(
							/* translators: %s: number of days */
							_n( 'Performance over the last %s day', 'Performance over the last %s days', currentDayCount, 'google-site-kit' ),
							currentDayCount
						) }
					/>
					<WidgetHeaderCTA
						href={ accountSiteURL }
						label={ sprintf(
							/* translators: %s: module name. */
							__( 'See full stats in %s', 'google-site-kit' ),
							_x( 'AdSense', 'Service name', 'google-site-kit' )
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

			<Grid className="googlesitekit-adsense-site-stats">
				<Row>
					<Cell size={ 12 }>
						<GoogleChart
							chartType="line"
							selectedStats={ [ selectedStats ] }
							data={ dataMap }
							options={ options }
						/>
					</Cell>
				</Row>
			</Grid>
		</Widget>
	);
};

export default ModuleOverviewWidget;
