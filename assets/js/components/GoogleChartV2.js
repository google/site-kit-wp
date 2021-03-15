/**
 * GoogleChartV2 component.
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
import classnames from 'classnames';
import { Chart } from 'react-google-charts';

/**
 * WordPress dependencies
 */
import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PreviewBlock from './PreviewBlock';

export default function GoogleChartV2( props ) {
	const {
		chartEvents,
		chartType,
		children,
		className,
		getChartWrapper,
		height,
		loaded,
		loadingHeight,
		loadingWidth,
		onMouseOver,
		onMouseOut,
		onReady,
		onSelect,
		width,
		...otherProps
	} = props;

	const loadingHeightToUse = loadingHeight || height;
	const loadingWidthToUse = loadingWidth || width;
	const loadingShape = chartType === 'PieChart' ? 'circular' : 'square';

	const loader = (
		<div className="googlesitekit-chart-v2-loading">
			<PreviewBlock
				className="googlesitekit-chart-v2-loading__wrapper"
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
			googleRef.current?.visualization.events.addListener( chartWrapperRef.current.getChart(), 'onmouseover', ( event ) => {
				onMouseOver( event, {
					chartWrapper: chartWrapperRef.current,
					google: googleRef.current,
				} );
			} );
		}

		if ( onMouseOut ) {
			// eslint-disable-next-line no-unused-expressions
			googleRef.current?.visualization.events.addListener( chartWrapperRef.current.getChart(), 'onmouseout', ( event ) => {
				onMouseOut( event, {
					chartWrapper: chartWrapperRef.current,
					google: googleRef.current,
				} );
			} );
		}
	}, [ onMouseOver, onMouseOut ] );

	if ( ! loaded ) {
		return (
			<div className={ classnames(
				'googlesitekit-chart-v2',
				'googlesitekit-chart-v2-loading__forced',
				className
			) }>
				{ loader }
			</div>
		);
	}

	const combinedChartEvents = [ ...chartEvents || [] ];

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

	return (
		<div
			className={ classnames(
				'googlesitekit-chart-v2',
				`googlesitekit-chart-v2--${ chartType }`,
				className
			) }
		>
			<Chart
				className="googlesitekit-chart-v2__inner"
				chartEvents={ combinedChartEvents }
				chartType={ chartType }
				loader={ loader }
				height={ height }
				getChartWrapper={ ( chartWrapper, google ) => {
					// Remove all the event listeners on the old chart before we draw
					// a new one. Only run this if the old chart and the new chart aren't
					// the same reference though, otherwise we'll remove existing `onReady`
					// events and other event listeners, which will cause bugs.
					if ( chartWrapper !== chartWrapperRef.current ) {
						// eslint-disable-next-line no-unused-expressions
						googleRef.current?.visualization.events.removeAllListeners( chartWrapperRef.current?.getChart() );
						// eslint-disable-next-line no-unused-expressions
						googleRef.current?.visualization.events.removeAllListeners( chartWrapperRef.current );
					}

					chartWrapperRef.current = chartWrapper;
					googleRef.current = google;

					if ( getChartWrapper ) {
						getChartWrapper( chartWrapper, google );
					}
				} }
				width={ width }
				{ ...otherProps }
			/>
			{ children }
		</div>
	);
}

GoogleChartV2.defaultProps = {
	...Chart.defaultProps,
	loaded: true,
};
