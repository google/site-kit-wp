/**
 * UserCountGraph component
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	UI_DIMENSION_COLOR,
} from '../../../datastore/constants';
import GoogleChart from '../../../../../components/GoogleChart';
import parseDimensionStringToDate from '../../../util/parseDimensionStringToDate';
import ReportError from '../../../../../components/ReportError';
import { createZeroDataRow } from './utils';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import useViewOnly from '../../../../../hooks/useViewOnly';
import { getDateString } from '../../../../../util';
const { useSelect } = Data;

export default function UserCountGraph( props ) {
	const { loaded, error, report, gatheringData } = props;

	const isViewOnly = useViewOnly();

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const graphLineColor = useSelect(
		( select ) =>
			select( CORE_UI ).getValue( UI_DIMENSION_COLOR ) || '#3c7251'
	);

	const propertyCreateTime = useSelect( ( select ) => {
		if ( isViewOnly ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();
	} );

	if ( error ) {
		return <ReportError moduleSlug="analytics-4" error={ error } />;
	}

	let rows;
	if ( Array.isArray( report?.rows ) ) {
		rows = report.rows;
	} else if ( gatheringData ) {
		rows = [];
	} else {
		// For the "zero data" case, we need to create a zero data row for the start
		// and end dates to ensure the chart renders the ticks at the correct offsets.
		rows = [ createZeroDataRow( startDate ), createZeroDataRow( endDate ) ];
	}

	const chartData = [
		[
			{
				type: 'date',
				label: __( 'Day', 'google-site-kit' ),
			},
			{
				type: 'number',
				label: __( 'Users', 'google-site-kit' ),
			},
		],
		...rows.map( ( { metricValues, dimensionValues } ) => [
			parseDimensionStringToDate( dimensionValues[ 0 ].value ),
			metricValues[ 0 ].value,
		] ),
	];

	const [ , ...ticks ] = chartData.slice( 1 ).map( ( [ date ] ) => date );

	const chartOptions = { ...UserCountGraph.chartOptions };

	chartOptions.series[ 0 ].color = graphLineColor;
	chartOptions.hAxis.ticks = ticks;

	// Set the `max` height of the chart to `undefined` so that the chart will
	// show all content, but only if the report is loaded/has data.
	if (
		! report?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value ||
		// The total returned by the API can be a string, so make sure we cast it
		// to a number.
		parseInt( report?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value, 10 ) === 0
	) {
		chartOptions.vAxis.viewWindow.max = 100;
	} else {
		chartOptions.vAxis.viewWindow.max = undefined;
	}

	return (
		<div className="googlesitekit-widget--analyticsAllTraffic__user-count-chart">
			<GoogleChart
				chartType="LineChart"
				data={ chartData }
				dateMarkers={
					propertyCreateTime
						? [
								{
									date: getDateString(
										new Date( propertyCreateTime )
									),
									text: __(
										'Google Analytics 4 property created',
										'google-site-kit'
									),
								},
						  ]
						: undefined
				}
				height="368px"
				loadingHeight="340px"
				loaded={ loaded }
				options={ chartOptions }
				gatheringData={ gatheringData }
				width="100%"
			/>
		</div>
	);
}

UserCountGraph.propTypes = {
	loaded: PropTypes.bool,
	error: PropTypes.shape( {} ),
	report: PropTypes.object,
	gatheringData: PropTypes.bool,
};

UserCountGraph.chartOptions = {
	animation: {
		startup: true,
	},
	curveType: 'function',
	height: 340,
	width: '100%',
	colors: [ '#3c7251' ],
	chartArea: {
		left: 7,
		right: 40,
		height: 300,
		top: 21,
	},
	legend: {
		position: 'none',
	},
	hAxis: {
		// This color is the result of placing `rgba(26, 115, 232, 0.08)` over the white (`#ffffff`) background.
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
		textStyle: {
			color: '#616161',
			fontSize: 12,
		},
		textPosition: 'out',
		viewWindow: {
			min: 0,
		},
	},
	series: {
		0: {
			lineWidth: 3,
			targetAxisIndex: 1,
		},
	},
	crosshair: {
		color: '#3c7251',
		opacity: 0.1,
		orientation: 'vertical',
	},
};
