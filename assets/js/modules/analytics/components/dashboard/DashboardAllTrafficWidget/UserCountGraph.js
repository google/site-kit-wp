
/**
 * UserCountGraph component
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { DATE_RANGE_OFFSET, FORM_ALL_TRAFFIC_WIDGET } from '../../../datastore/constants';
import GoogleChart from '../../../../../components/GoogleChart';
import parseDimensionStringToDate from '../../../util/parseDimensionStringToDate';
import PreviewBlock from '../../../../../components/PreviewBlock';
import ReportError from '../../../../../components/ReportError';
const { useSelect } = Data;

export default function UserCountGraph( { loaded, error, report } ) {
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ) );
	const graphLineColor = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionColor' ) || '#1a73e8' );

	if ( ! loaded ) {
		return <PreviewBlock width="100%" height="300px" shape="square" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	const rows = Array.isArray( report?.[ 0 ]?.data?.rows )
		? report?.[ 0 ]?.data?.rows
		: [];

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
		...rows.map( ( { metrics, dimensions } ) => [
			parseDimensionStringToDate( dimensions[ 0 ] ),
			metrics[ 0 ].values[ 0 ],
		] ),
	];

	const chartOptions = { ...UserCountGraph.chartOptions };
	chartOptions.hAxis.ticks = [ new Date( startDate ), new Date( endDate ) ];
	chartOptions.series[ 0 ].color = graphLineColor;

	return (
		<div className="googlesitekit-widget--analyticsAllTraffic__user-count-chart">
			<GoogleChart
				chartType="line"
				data={ chartData }
				options={ chartOptions }
				loadHeight={ 50 }
			/>
		</div>
	);
}

UserCountGraph.propTypes = {
	loaded: PropTypes.bool,
	error: PropTypes.shape( {} ),
	report: PropTypes.arrayOf( PropTypes.object ),
};

UserCountGraph.chartOptions = {
	animation: {
		startup: true,
	},
	curveType: 'function',
	height: 340,
	width: '100%',
	colors: [ '#1a73e8' ],
	chartArea: {
		height: '80%',
		width: '80%',
	},
	legend: {
		position: 'none',
	},
	hAxis: {
		backgroundColor: '#eef4fd', // rgba(26, 115, 232, 0.08) over the white background.
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
	vAxes: {
		0: {
			baseline: 0,
			gridlines: {
				color: '#ffffff',
			},
			viewWindow: {
				max: 1,
				min: 0,
			},
			viewWindowMode: 'explicit',
			textPosition: 'none',
			ticks: [],
		},
		1: {
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
	},
	series: {
		0: {
			lineWidth: 3,
			targetAxisIndex: 1,
		},
	},
	crosshair: {
		color: '#1a73e8',
		opacity: 0.1,
		orientation: 'vertical',
	},
};
