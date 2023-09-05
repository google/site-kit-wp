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
import { useEffect, useState } from '@wordpress/element';

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
import { stringToDate } from '../../../../../util/date-range/string-to-date';
import { createZeroDataRow } from './utils';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import { getDateString } from '../../../../../util';
import useViewOnly from '../../../../../hooks/useViewOnly';
const { useSelect } = Data;

const X_SMALL_ONLY_MEDIA_QUERY = '(max-width: 450px)';
const MOBILE_TO_DESKTOP_MEDIA_QUERY =
	'(min-width: 451px) and (max-width: 1280px';
const X_LARGE_AND_ABOVE_MEDIA_QUERY = '(min-width: 1281px)';

export default function UserCountGraph( props ) {
	const { loaded, error, report, gatheringData } = props;

	const isViewOnly = useViewOnly();

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);
	const dateRangeNumberOfDays = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);
	const graphLineColor = useSelect(
		( select ) =>
			select( CORE_UI ).getValue( UI_DIMENSION_COLOR ) || '#3c7251'
	);

	const [ xSmallOnly, setXSmallOnly ] = useState(
		global.matchMedia( X_SMALL_ONLY_MEDIA_QUERY )
	);
	const [ mobileToDesktop, setMobileToDesktop ] = useState(
		global.matchMedia( MOBILE_TO_DESKTOP_MEDIA_QUERY )
	);
	const [ xLargeAndAbove, setXLargeAndAbove ] = useState(
		global.matchMedia( X_LARGE_AND_ABOVE_MEDIA_QUERY )
	);

	// Watch media queries to adjust the ticks based on the app breakpoints.
	useEffect( () => {
		const updateBreakpoints = () => {
			setXSmallOnly( global.matchMedia( X_SMALL_ONLY_MEDIA_QUERY ) );
			setMobileToDesktop(
				global.matchMedia( MOBILE_TO_DESKTOP_MEDIA_QUERY )
			);
			setXLargeAndAbove(
				global.matchMedia( X_LARGE_AND_ABOVE_MEDIA_QUERY )
			);
		};

		global.addEventListener( 'resize', updateBreakpoints );
		return () => {
			global.removeEventListener( 'resize', updateBreakpoints );
		};
	}, [] );

	const property = useSelect( ( select ) => {
		if ( isViewOnly ) {
			return null;
		}

		const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

		if ( ! propertyID ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getProperty( propertyID );
	} );

	const propertyCreatedDate = property?.createTime
		? getDateString( new Date( property.createTime ) )
		: null;

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
	const startTick = stringToDate( startDate );
	startTick.setDate( stringToDate( startDate ).getDate() + outerTickOffset );
	const endTick = stringToDate( endDate );
	endTick.setDate( stringToDate( endDate ).getDate() - outerTickOffset );
	const midTicks = [];

	// Create the mid ticks.
	const tickDenominator = totalTicks - 1; // Used to place the midTicks and even intervals across the axis.
	totalTicks = totalTicks - 2; // The start and end ticks are already set.
	while ( totalTicks > 0 ) {
		const midTick = stringToDate( endDate );
		midTick.setDate(
			stringToDate( endDate ).getDate() -
				totalTicks * ( dateRangeNumberOfDays / tickDenominator )
		);
		midTicks.push( midTick );

		totalTicks = totalTicks - 1;
	}

	const chartOptions = { ...UserCountGraph.chartOptions };

	chartOptions.series[ 0 ].color = graphLineColor;
	chartOptions.hAxis.ticks = [ startTick, ...midTicks, endTick ];

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
					propertyCreatedDate
						? [
								{
									date: propertyCreatedDate,
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
