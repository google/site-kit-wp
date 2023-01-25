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
import '../../util/initialize-google-global';

/**
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Chart } from 'react-google-charts';

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
import PreviewBlock from '../PreviewBlock';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import GatheringDataNotice, { NOTICE_STYLE } from '../GatheringDataNotice';

import Data from 'googlesitekit-data';
import {
	getFilteredChartData,
	getLoadingDimensions,
	getCombinedChartEvents,
	getChartOptions,
} from './utils';
import GoogleChartErrorHandler from '../GoogleChartErrorHandler';
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

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates()
	);

	const [ isChartLoaded, setIsChartLoaded ] = useState( false );

	const filteredData = getFilteredChartData( data, selectedStats );

	const loadingShape = chartType === 'PieChart' ? 'circular' : 'square';
	const loadingDimensions = getLoadingDimensions(
		loadingHeight,
		height,
		loadingWidth,
		width
	);

	const loader = (
		<div className="googlesitekit-chart-loading">
			<PreviewBlock
				className="googlesitekit-chart-loading__wrapper"
				shape={ loadingShape }
				{ ...loadingDimensions }
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

	const combinedChartEvents = getCombinedChartEvents(
		chartEvents,
		onReady,
		onSelect
	);

	const chartOptions = getChartOptions(
		options,
		gatheringData,
		chartType,
		startDate,
		endDate
	);

	return (
		<GoogleChartErrorHandler>
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
					data={ filteredData }
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
						// a new one. Only run this if the old chart and the new chart
						// aren't the same reference though, otherwise we'll remove
						// existing `onReady` events and other event listeners, which will
						// cause bugs.
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
				{ gatheringData && isChartLoaded && (
					<GatheringDataNotice style={ NOTICE_STYLE.OVERLAY } />
				) }
				{ children }
			</div>
		</GoogleChartErrorHandler>
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
