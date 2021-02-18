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
import { Fragment, useLayoutEffect, useRef } from '@wordpress/element';

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
		loadingShape,
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
		<Fragment>
			<Chart
				chartEvents={ combinedChartEvents }
				chartType={ chartType }
				className={ classnames(
					'googlesitekit-chart-v2',
					`googlesitekit-chart-v2--${ chartType }`,
					className
				) }
				loader={ loader }
				height={ height }
				getChartWrapper={ ( chartWrapper, google ) => {
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
		</Fragment>
	);
}

GoogleChartV2.defaultProps = {
	...Chart.defaultProps,
	loaded: true,
	loadingShape: 'circular',
};
