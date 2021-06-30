/**
 * LegacyAdSenseDashboardWidgetSiteStats component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { Cell, Grid, Row } from '../../../../material-components';
import ReportError from '../../../../components/ReportError';
import ReportZero from '../../../../components/ReportZero';
import PreviewBlock from '../../../../components/PreviewBlock';
import GoogleChart from '../../../../components/GoogleChart';
import { getSiteStatsDataForGoogleChart, isZeroReport } from '../../util';
const { useSelect } = Data;

export default function LegacyAdSenseDashboardWidgetSiteStats( props ) {
	const {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		metrics,
		selectedStats,
	} = props;

	const currentRangeArgs = {
		dimensions: [ 'DATE' ],
		metrics: Object.keys( metrics ),
		startDate,
		endDate,
	};

	const prevRangeArgs = {
		dimensions: [ 'DATE' ],
		metrics: Object.keys( metrics ),
		startDate: compareStartDate,
		endDate: compareEndDate,
	};

	const currentRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( currentRangeArgs ) );
	const prevRangeData = useSelect( ( select ) => select( STORE_NAME ).getReport( prevRangeArgs ) );

	const resolvedCurrentData = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ currentRangeArgs ] ) );
	const resolvedPreviousData = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ prevRangeArgs ] ) );

	const currentError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ) );
	const previousError = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ prevRangeArgs ] ) );

	if ( ! resolvedCurrentData || ! resolvedPreviousData ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( currentError || previousError ) {
		const error = currentError || previousError;
		return <ReportError moduleSlug="adsense" error={ error } />;
	}

	if ( isZeroReport( currentRangeData ) ) {
		return <ReportZero moduleSlug="adsense" />;
	}

	const options = {
		curveType: 'function',
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
			format: LegacyAdSenseDashboardWidgetSiteStats.formats[ currentRangeData.headers[ selectedStats + 1 ].type ],
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
			viewWindow: {
				min: 0,
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
				color: LegacyAdSenseDashboardWidgetSiteStats.colors[ selectedStats ],
				targetAxisIndex: 0,
			},
			1: {
				color: LegacyAdSenseDashboardWidgetSiteStats.colors[ selectedStats ],
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		},
	};

	const dataMap = getSiteStatsDataForGoogleChart(
		currentRangeData,
		prevRangeData,
		Object.values( metrics )[ selectedStats ],
		selectedStats + 1,
		currentRangeData.headers[ selectedStats + 1 ],
	);

	return (
		<Grid className="googlesitekit-adsense-site-stats">
			<Row>
				<Cell size={ 12 }>
					<GoogleChart
						chartType="LineChart"
						data={ dataMap }
						loadingHeight="250px"
						loadingWidth="100%"
						options={ options }
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

LegacyAdSenseDashboardWidgetSiteStats.colors = [
	'#4285f4',
	'#27bcd4',
	'#1b9688',
	'#673ab7',
];

LegacyAdSenseDashboardWidgetSiteStats.formats = {
	METRIC_TALLY: undefined,
	METRIC_CURRENCY: 'currency',
	METRIC_RATIO: 'percent',
	METRIC_DECIMAL: 'decimal',
	METRIC_MILLISECONDS: undefined,
};

LegacyAdSenseDashboardWidgetSiteStats.propTypes = {
	startDate: PropTypes.string.isRequired,
	endDate: PropTypes.string.isRequired,
	compareStartDate: PropTypes.string.isRequired,
	compareEndDate: PropTypes.string.isRequired,
	metrics: PropTypes.shape( {} ).isRequired,
	selectedStats: PropTypes.number.isRequired,
};
