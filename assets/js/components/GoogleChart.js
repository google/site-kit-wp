/**
 * GoogleChart component.
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
/* eslint-disable react-hooks/exhaustive-deps */

/* Ensures `google` global is undefined before loading `react-google-charts` library */
import '../util/initialize-google-global';

/**
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Chart } from 'react-google-charts';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

/**
 * WordPress dependencies
 */
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import PreviewBlock from './PreviewBlock';
import { useFeature } from '../hooks/useFeature';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import GatheringDataNotice, { NOTICE_STYLE } from './GatheringDataNotice';
import Data from 'googlesitekit-data';
const { useSelect } = Data;

export default function GoogleChart( props ) {
	const {
		chartEvents,
		chartType,
		children,
		className,
		data,
		getChartWrapper,
		height,
		loaded,
		loadingHeight,
		loadingWidth,
		onMouseOver,
		onMouseOut,
		onReady,
		onSelect,
		selectedStats,
		width,
		options,
		gatheringData = false,
		...otherProps
	} = props;
	const zeroDataStatesEnabled = useFeature( 'zeroDataStates' );

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates()
	);

	const [ isChartLoaded, setIsChartLoaded ] = useState( false );

	// Ensure we don't filter out columns that aren't data, but are things like
	// tooltips or other content.
	let nonDataColumns = [];
	if ( data?.length ) {
		nonDataColumns = data[ 0 ].reduce( ( acc, row, rowIndex ) => {
			return row?.role ? [ ...acc, rowIndex ] : acc;
		}, [] );
	}

	// If only certain columns should be displayed for the data set we have
	// then filter out that data.
	let modifiedData = data;
	if ( selectedStats?.length > 0 ) {
		modifiedData = data.map( ( row ) => {
			return row.filter( ( _columnValue, columnIndex ) => {
				return (
					columnIndex === 0 ||
					selectedStats.includes( columnIndex - 1 ) ||
					nonDataColumns.includes( columnIndex - 1 )
				);
			} );
		} );
	}

	let loadingHeightToUse = loadingHeight || height;
	let loadingWidthToUse = loadingWidth || width;
	// If a loading height is set but a width is not (or a loading width is set
	// but not a height), change the "unset" value to 100% to avoid visual bugs.
	// See: https://github.com/google/site-kit-wp/pull/2916#discussion_r623866269
	if ( loadingHeightToUse && ! loadingWidthToUse ) {
		loadingWidthToUse = '100%';
	}
	if ( loadingWidthToUse && ! loadingHeightToUse ) {
		loadingHeightToUse = '100%';
	}
	const loadingShape = chartType === 'PieChart' ? 'circular' : 'square';

	const loader = (
		<div className="googlesitekit-chart-loading">
			<PreviewBlock
				className="googlesitekit-chart-loading__wrapper"
				height={ loadingHeightToUse }
				shape={ loadingShape }
				width={ loadingWidthToUse }
			/>
		</div>
	);

	const chartWrapperRef = useRef();
	const googleRef = useRef();

	useEffect( () => {
		// Remove all event listeners after the component has unmounted.
		return () => {
			// eslint-disable-next-line no-unused-expressions
			if ( googleRef.current && chartWrapperRef.current ) {
				const { events } = googleRef.current.visualization;
				events.removeAllListeners( chartWrapperRef.current.getChart() );
				events.removeAllListeners( chartWrapperRef.current );
			}
		};
	}, [] );

	// These event listeners are added manually to the current chart because
	// `react-google-charts` doesn't support `mouseOver` or `mouseOut` events
	// in its `chartEvents` prop.
	// See: https://github.com/google/site-kit-wp/pull/2805#discussion_r579172660
	useLayoutEffect( () => {
		if ( onMouseOver ) {
			// eslint-disable-next-line no-unused-expressions
			googleRef.current?.visualization.events.addListener(
				chartWrapperRef.current.getChart(),
				'onmouseover',
				( event ) => {
					onMouseOver( event, {
						chartWrapper: chartWrapperRef.current,
						google: googleRef.current,
					} );
				}
			);
		}

		if ( onMouseOut ) {
			// eslint-disable-next-line no-unused-expressions
			googleRef.current?.visualization.events.addListener(
				chartWrapperRef.current.getChart(),
				'onmouseout',
				( event ) => {
					onMouseOut( event, {
						chartWrapper: chartWrapperRef.current,
						google: googleRef.current,
					} );
				}
			);
		}
	}, [ onMouseOver, onMouseOut ] );

	if ( ! loaded ) {
		return (
			<div
				className={ classnames(
					'googlesitekit-chart',
					'googlesitekit-chart-loading__forced',
					className
				) }
			>
				{ loader }
			</div>
		);
	}

	const combinedChartEvents = [ ...( chartEvents || [] ) ];

	if ( onReady ) {
		combinedChartEvents.push( {
			eventName: 'ready',
			callback: onReady,
		} );
	}

	if ( onSelect ) {
		combinedChartEvents.push( {
			eventName: 'select',
			callback: onSelect,
		} );
	}

	const chartOptions = cloneDeep( options );
	if ( zeroDataStatesEnabled && gatheringData && chartType === 'LineChart' ) {
		if ( ! options?.vAxis?.viewWindow?.min ) {
			set( chartOptions, 'vAxis.viewWindow.min', 0 );
		}
		if ( ! options?.vAxis?.viewWindow?.max ) {
			set( chartOptions, 'vAxis.viewWindow.max', 100 );
		}
		if ( ! options?.hAxis?.viewWindow?.min ) {
			set( chartOptions, 'hAxis.viewWindow.min', new Date( startDate ) );
			delete chartOptions.hAxis.ticks;
		}
		if ( ! options?.hAxis?.viewWindow?.max ) {
			set( chartOptions, 'hAxis.viewWindow.max', new Date( endDate ) );
			delete chartOptions.hAxis.ticks;
		}
	}

	merge( chartOptions, {
		hAxis: {
			textStyle: {
				fontSize: 10,
				color: '#5f6561',
			},
		},
		vAxis: {
			textStyle: {
				color: '#5f6561',
				fontSize: 10,
			},
		},
		legend: {
			textStyle: {
				color: '#131418',
				fontSize: 12,
			},
		},
	} );

	return (
		<div
			className={ classnames(
				'googlesitekit-chart',
				`googlesitekit-chart--${ chartType }`,
				className
			) }
			tabIndex={ -1 }
		>
			<Chart
				className="googlesitekit-chart__inner"
				chartEvents={ combinedChartEvents }
				chartType={ chartType }
				chartVersion="49"
				data={ modifiedData }
				loader={ loader }
				height={ height }
				getChartWrapper={ ( chartWrapper, google ) => {
					// An issue with `react-google-charts` v4 causes the chart to
					// render the overlay before the chart in some cases when using
					// their own `onLoad` callback. This is a workaround to prevent
					// that issue but still provide notice that the chart is loaded.
					// See: https://github.com/google/site-kit-wp/issues/4945
					if ( ! isChartLoaded ) {
						setIsChartLoaded( true );
					}

					// Remove all the event listeners on the old chart before we draw
					// a new one. Only run this if the old chart and the new chart aren't
					// the same reference though, otherwise we'll remove existing `onReady`
					// events and other event listeners, which will cause bugs.
					if ( chartWrapper !== chartWrapperRef.current ) {
						// eslint-disable-next-line no-unused-expressions
						googleRef.current?.visualization.events.removeAllListeners(
							chartWrapperRef.current?.getChart()
						);
						// eslint-disable-next-line no-unused-expressions
						googleRef.current?.visualization.events.removeAllListeners(
							chartWrapperRef.current
						);
					}

					chartWrapperRef.current = chartWrapper;
					googleRef.current = google;

					if ( getChartWrapper ) {
						getChartWrapper( chartWrapper, google );
					}
				} }
				width={ width }
				options={ chartOptions }
				{ ...otherProps }
			/>
			{ zeroDataStatesEnabled && gatheringData && isChartLoaded && (
				<GatheringDataNotice style={ NOTICE_STYLE.OVERLAY } />
			) }
			{ children }
		</div>
	);
}

GoogleChart.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
	chartEvents: PropTypes.arrayOf(
		PropTypes.shape( {
			eventName: PropTypes.string,
			callback: PropTypes.func,
		} )
	),
	// Note: technically we support all types of charts that `react-google-charts`
	// supports, which is _all_ chart types from Google Charts. But we only list
	// the charts currently used in our codebase here, and only ones that we have
	// explicit support/styles/handling for.
	// See: https://github.com/google/site-kit-wp/pull/2916#discussion_r626620601
	chartType: PropTypes.oneOf( [ 'LineChart', 'PieChart' ] ).isRequired,
	data: PropTypes.array,
	getChartWrapper: PropTypes.func,
	height: PropTypes.string,
	loaded: PropTypes.bool,
	loadingHeight: PropTypes.string,
	loadingWidth: PropTypes.string,
	onMouseOut: PropTypes.func,
	onMouseOver: PropTypes.func,
	onReady: PropTypes.func,
	onSelect: PropTypes.func,
	selectedStats: PropTypes.arrayOf( PropTypes.number ),
	width: PropTypes.string,
	options: PropTypes.object,
	gatheringData: PropTypes.bool,
};

GoogleChart.defaultProps = {
	...Chart.defaultProps,
	loaded: true,
};
