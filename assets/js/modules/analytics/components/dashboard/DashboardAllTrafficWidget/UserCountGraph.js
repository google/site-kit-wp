
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
	const numberOfDays = useSelect( ( select ) => select( CORE_USER ).getDateRangeNumberOfDays() );
	const graphLineColor = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_ALL_TRAFFIC_WIDGET, 'dimensionColor' ) || '#1a73e8' );

	if ( ! loaded ) {
		// On desktop, the real graph height is 350px, so match that here.
		return <PreviewBlock width="100%" height="350px" shape="square" />;
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

	// Putting the actual start and end dates in the ticks causes the charts not to render
	// them. See: https://github.com/google/site-kit-wp/issues/2708.
	// On smaller screens we set a larger offset to avoid ticks getting cut off.
	let outerTickOffset = 1;
	let totalTicks = 2;

	// Watch media queries to adjust the ticks based on the app breakpoints.
	const xSmallOnly = global.window.matchMedia( '(max-width: 450px)' );
	const mobileOnly = global.window.matchMedia( '(min-width: 451px) and (max-width: 600px)' );
	const tabletOnly = global.window.matchMedia( '(min-width: 601px) and (max-width: 960px)' );
	const desktopOnly = global.window.matchMedia( '(min-width: 961px) and (max-width: 1280px' );
	const xLargeAndAbove = global.window.matchMedia( '(min-width: 1281px)' );

	// On xsmall devices, increase the outer tick offset on mobile to make both ticks visible without ellipsis.
	if ( xSmallOnly.matches ) {
		if ( numberOfDays > 28 ) {
			outerTickOffset = 5;
		} else if ( numberOfDays > 7 ) {
			outerTickOffset = 2;
		}
	}

	// On mobile devices, include a total of three ticks and increase the outer tick offset with more dense data.
	if ( mobileOnly.matches ) {
		if ( numberOfDays > 28 ) {
			outerTickOffset = 5;
		} else if ( numberOfDays > 7 ) {
			outerTickOffset = 2;
		}

		if ( numberOfDays > 7 ) {
			totalTicks = 3;
		}
	}

	// On tablet devices, include a total of three ticks and increase the outer tick offset with more dense data.
	if ( tabletOnly.matches || desktopOnly.matches ) {
		if ( numberOfDays > 28 ) {
			outerTickOffset = 5;
		} else if ( numberOfDays > 7 ) {
			outerTickOffset = 2;
		}

		if ( numberOfDays > 7 ) {
			totalTicks = 3;
		}
	}

	// On desktop and larger devices, add a third and fourth tick.
	if ( xLargeAndAbove.matches ) {
		if ( numberOfDays > 28 ) {
			outerTickOffset = 3;
		}

		if ( numberOfDays > 7 ) {
			totalTicks = 4;
		}
	}

	// Create the start and end ticks, applying the outer offset.
	const startTick = new Date( startDate );
	startTick.setDate( new Date( startDate ).getDate() + outerTickOffset );
	const endTick = new Date( endDate );
	endTick.setDate( new Date( endDate ).getDate() - outerTickOffset );
	const midTicks = [];

	// Create the mid ticks.
	const tickDenominator = totalTicks - 1; // Used to place the midTicks and even intervals across the axis.
	totalTicks = totalTicks - 2; // The start and end ticks are already set.
	while ( totalTicks > 0 ) {
		const midTick = new Date( endDate );
		midTick.setDate( new Date( endDate ).getDate() - ( totalTicks * ( numberOfDays / tickDenominator ) ) );
		midTicks.push( midTick );

		totalTicks = totalTicks - 1;
	}

	chartOptions.hAxis.ticks = [ startTick, ...midTicks, endTick ];
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
		left: '1%',
		height: 300,
		top: 21,
		width: '90%',
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
