
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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET, UI_DIMENSION_COLOR } from '../../../datastore/constants';
import GoogleChart from '../../../../../components/GoogleChart';
import parseDimensionStringToDate from '../../../util/parseDimensionStringToDate';
import ReportError from '../../../../../components/ReportError';
const { useSelect } = Data;

const X_SMALL_ONLY_MEDIA_QUERY = '(max-width: 450px)';
const MOBILE_TO_DESKOP_MEDIA_QUERY = '(min-width: 451px) and (max-width: 1280px';
const X_LARGE_AND_ABOVE_MEDIA_QUERY = '(min-width: 1281px)';

export default function UserCountGraph( { loaded, error, report } ) {
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ) );
	const dateRangeNumberOfDays = useSelect( ( select ) => select( CORE_USER ).getDateRangeNumberOfDays() );
	const graphLineColor = useSelect( ( select ) => select( CORE_UI ).getValue( UI_DIMENSION_COLOR ) || '#1a73e8' );

	const [ xSmallOnly, setXSmallOnly ] = useState( global.matchMedia( X_SMALL_ONLY_MEDIA_QUERY ) );
	const [ mobileToDesktop, setMobileToDesktop ] = useState( global.matchMedia( MOBILE_TO_DESKOP_MEDIA_QUERY ) );
	const [ xLargeAndAbove, setXLargeAndAbove ] = useState( global.matchMedia( X_LARGE_AND_ABOVE_MEDIA_QUERY ) );

	// Watch media queries to adjust the ticks based on the app breakpoints.
	useEffect( () => {
		const updateBreakpoints = () => {
			setXSmallOnly( global.matchMedia( X_SMALL_ONLY_MEDIA_QUERY ) );
			setMobileToDesktop( global.matchMedia( MOBILE_TO_DESKOP_MEDIA_QUERY ) );
			setXLargeAndAbove( global.matchMedia( X_LARGE_AND_ABOVE_MEDIA_QUERY ) );
		};

		global.addEventListener( 'resize', updateBreakpoints );
		return () => {
			global.removeEventListener( 'resize', updateBreakpoints );
		};
	}, [] );

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

	// On xsmall devices, increase the outer tick offset on mobile to make both ticks visible without ellipsis.
	if ( xSmallOnly.matches ) {
		if ( dateRangeNumberOfDays > 28 ) {
			outerTickOffset = 8;
		} else if ( dateRangeNumberOfDays > 7 ) {
			outerTickOffset = 3;
		}

		if ( dateRangeNumberOfDays > 7 ) {
			totalTicks = 3;
		}
	}

	// On mobile, desktop and tablet devices, include a total of three ticks and increase the outer tick offset with more dense data.
	if ( mobileToDesktop.matches ) {
		if ( dateRangeNumberOfDays > 28 ) {
			outerTickOffset = 5;
		} else if ( dateRangeNumberOfDays > 7 ) {
			outerTickOffset = 2;
		}

		if ( dateRangeNumberOfDays > 7 ) {
			totalTicks = 3;
		}
	}

	// On devices larger than desktop, add a third and fourth tick.
	if ( xLargeAndAbove.matches ) {
		if ( dateRangeNumberOfDays > 28 ) {
			outerTickOffset = 5;
		}

		if ( dateRangeNumberOfDays > 7 ) {
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
		midTick.setDate( new Date( endDate ).getDate() - ( totalTicks * ( dateRangeNumberOfDays / tickDenominator ) ) );
		midTicks.push( midTick );

		totalTicks = totalTicks - 1;
	}

	chartOptions.hAxis.ticks = [ startTick, ...midTicks, endTick ];
	chartOptions.series[ 0 ].color = graphLineColor;

	return (
		<div className="googlesitekit-widget--analyticsAllTraffic__user-count-chart">
			<GoogleChart
				chartType="LineChart"
				data={ chartData }
				height="368px"
				loadingHeight="340px"
				loaded={ loaded }
				options={ chartOptions }
				width="100%"
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
