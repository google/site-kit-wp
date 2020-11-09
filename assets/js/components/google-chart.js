/**
 * GoogleChart component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ProgressBar from './ProgressBar';

let chartLoadPromise;

async function loadCharts() {
	if ( chartLoadPromise ) {
		return chartLoadPromise;
	}

	// Inject the script if not already loaded and resolve on load.
	if ( ! global.google || ! global.google.charts ) {
		const script = document.createElement( 'script' );
		script.type = 'text/javascript';

		chartLoadPromise = new Promise( ( resolve ) => {
			script.onload = resolve;
			// Add the script to the DOM
			global.document.head.appendChild( script );
			// Set the `src` to begin transport
			script.src = '//www.gstatic.com/charts/loader.js';
		} );
	} else {
		// Charts is already available - resolve immediately.
		chartLoadPromise = Promise.resolve();
	}

	return chartLoadPromise;
}

export default function GoogleChart( props ) {
	const {
		chartType,
		className,
		data,
		loadCompressed,
		loadHeight,
		loadSmall,
		loadText,
		options,
		selectedStats,
		singleStat,
	} = props;

	const chartRef = useRef( null );
	const [ chart, setChart ] = useState( null );
	const [ loading, setLoading ] = useState( true );

	const drawChart = useCallback( () => {
		let dataTable = global.google?.visualization?.arrayToDataTable?.( data );
		if ( dataTable ) {
			if ( selectedStats.length > 0 ) {
				dataTable = new global.google.visualization.DataView( dataTable );
				if ( ! singleStat ) {
					dataTable.setColumns( [
						0,
						...selectedStats.map( ( stat ) => stat + 1 ),
					] );
				}
			}

			chart.draw( dataTable, options );
		}
	}, [ chart, data, singleStat, selectedStats ] );

	useEffect( () => {
		loadCharts().then( () => {
			global.google.charts.load( 'current', {
				packages: [ 'corechart' ],
				callback: () => {
					setLoading( false );
				},
			} );
		} );

		const resize = debounce( drawChart, 100 );
		global.addEventListener( 'resize', resize );

		return () => {
			global.removeEventListener( 'resize', resize );
		};
	}, [] );

	// Create a new chart when the library is loaded.
	useEffect( () => {
		if ( ! loading && chartRef.current && global.google ) {
			const googleChart = 'pie' === chartType
				? new global.google.visualization.PieChart( chartRef.current )
				: new global.google.visualization.LineChart( chartRef.current );
			setChart( googleChart );
		}
	}, [ loading, !! chartRef.current, chartType ] );

	// Draw the chart whenever one of these properties has changed.
	useEffect( () => {
		if ( chart ) {
			drawChart();
		}
	}, [
		chart,
		selectedStats,
		options,
		singleStat,
	] );

	return (
		<div className="googlesitekit-graph-wrapper">
			<div ref={ chartRef } className="googlesitekit-line-chart">
				<div className="googlesitekit-chart-loading">
					{ loading && (
						<div className="googlesitekit-chart-loading__wrapper">
							{ loadText && (
								<p>{ __( 'Loading chart…', 'google-site-kit' ) }</p>
							) }

							<ProgressBar
								className={ className }
								small={ loadSmall }
								compress={ loadCompressed }
								height={ loadHeight }
							/>
						</div>
					) }
				</div>
			</div>
		</div>
	);
}

GoogleChart.propTypes = {
	chartType: PropTypes.string,
	className: PropTypes.string,
	data: PropTypes.arrayOf( PropTypes.array ),
	loadCompressed: PropTypes.bool,
	loadHeight: PropTypes.number,
	loadSmall: PropTypes.bool,
	loadText: PropTypes.bool,
	options: PropTypes.object.isRequired,
	selectedStats: PropTypes.array,
	singleStat: PropTypes.bool,
};

GoogleChart.defaultProps = {
	chartType: 'line',
	className: '',
	data: [],
	loadCompressed: false,
	loadSmall: false,
	loadHeight: null,
	loadText: true,
	selectedStats: [],
	singleStat: true,
};
