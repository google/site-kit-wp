/**
 * AdSenseDashboardWidgetSiteStats component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { Cell, Grid, Row } from '../../../../material-components';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import getNoDataComponent from '../../../../components/notifications/nodata';
import PreviewBlock from '../../../../components/PreviewBlock';
import GoogleChart from '../../../../components/google-chart';
import { isDataZeroAdSense, getSiteStatsDataForGoogleChart } from '../../util';
const { useSelect } = Data;

export default function AdSenseDashboardWidgetSiteStats( { selectedStats } ) {
	const {
		currentRangeData,
		prevRangeData,
		error,
		isLoading,
	} = useSelect( ( select ) => {
		const {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} = select( CORE_USER ).getDateRangeDates( { compare: true } );

		const metrics = [ 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS', 'PAGE_VIEWS_CTR' ];

		const currentRangeArgs = {
			dimension: [ 'DATE' ],
			metrics,
			startDate,
			endDate,
		};

		const prevRangeArgs = {
			dimension: [ 'DATE' ],
			metrics,
			startDate: compareStartDate,
			endDate: compareEndDate,
		};

		return {
			currentRangeData: select( STORE_NAME ).getReport( currentRangeArgs ) || {},
			prevRangeData: select( STORE_NAME ).getReport( prevRangeArgs ) || {},

			error: select( STORE_NAME ).getErrorForSelector( 'getReport', [ currentRangeArgs ] ) ||
				select( STORE_NAME ).getErrorForSelector( 'getReport', [ prevRangeArgs ] ),

			isLoading: select( STORE_NAME ).isResolving( 'getReport', [ currentRangeArgs ] ) ||
				select( STORE_NAME ).isResolving( 'getReport', [ prevRangeArgs ] ),
		};
	} );

	if ( isLoading ) {
		return <PreviewBlock width="100%" height="250px" />;
	}

	if ( error ) {
		return getDataErrorComponent( 'adsense', error.message, false, false, false, error );
	}

	// TODO: rework this to use the new isZeroReport function once https://github.com/google/site-kit-wp/issues/2242 is implemented
	const dataRequest = { data: { dateRange: 'last-28-days' } };
	if ( isDataZeroAdSense( currentRangeData, undefined, dataRequest ) ) {
		return getNoDataComponent( _x( 'AdSense', 'Service name', 'google-site-kit' ), true, true, true );
	}

	const colorMap = {
		0: '#4285f4',
		1: '#27bcd4',
		2: '#1b9688',
		3: '#673ab7',
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
		// tooltip: {
		// 	isHtml: true, // eslint-disable-line sitekit/camelcase-acronyms
		// 	trigger: 'both',
		// },
	};

	options.series = {
		0: {
			color: colorMap[ selectedStats ],
			targetAxisIndex: 0,
		},
		1: {
			color: colorMap[ selectedStats ],
			targetAxisIndex: 0,
			lineDashStyle: [ 3, 3 ],
			lineWidth: 1,
		},
	};

	options.vAxes = null;

	const metrics = [ 'Earnings', 'Page RPM', 'Impressions', 'Page CTR' ];
	const dataMap = getSiteStatsDataForGoogleChart(
		currentRangeData,
		prevRangeData,
		metrics[ selectedStats ],
		selectedStats,
	);

	return (
		<Grid className="googlesitekit-adsense-site-stats">
			<Row>
				<Cell size={ 12 }>
					<GoogleChart
						selectedStats={ [ selectedStats ] }
						data={ dataMap }
						options={ options }
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

AdSenseDashboardWidgetSiteStats.propTypes = {
	selectedStats: PropTypes.number.isRequired,
};
