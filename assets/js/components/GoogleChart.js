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

/**
 * External dependencies
 */
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ProgressBar from './ProgressBar';

export default function GoogleChart( props ) {
	const {
		chartID,
		chartType,
		className,
		data,
		loadCompressed,
		loadHeight,
		loadSmall,
		loadText,
		onReady,
		options,
		selectedStats,
		singleStat,
	} = props;

	const chartRef = useRef( null );
	const [ chart, setChart ] = useState( null );
	const [ loading, setLoading ] = useState( true );
	const [ visualizationLoaded, setVisualizationLoaded ] = useState( false );

	// Create a new chart when the library is loaded.
	useEffect( () => {
		if ( ! chart && ! loading && chartRef.current && visualizationLoaded ) {
			let googleChart;

			if ( ! chartID || ! GoogleChart.charts.has( chartID ) ) {
				switch ( chartType ) {
					case 'area':
						googleChart = new global.google.visualization.AreaChart( chartRef.current );
						break;
					case 'line':
						googleChart = new global.google.visualization.LineChart( chartRef.current );
						break;
					case 'pie':
						googleChart = new global.google.visualization.PieChart( chartRef.current );
						break;
					default:
						throw new Error( 'Unknown chart type' );
				}

				const chartData = { chart: googleChart };
				if ( onReady ) {
					chartData.onReady = global.google.visualization.events.addListener( googleChart, 'ready', onReady );
				}

				if ( chartID ) {
					GoogleChart.charts.set( chartID, chartData );
				}
			} else {
				googleChart = GoogleChart.charts.get( chartID ).chart;
			}

			setChart( googleChart );
		}
	}, [ loading, visualizationLoaded, chart, chartID, chartType, onReady ] );

	// Draw the chart whenever one of these properties has changed.
	useEffect( () => {
		const drawChart = () => {
			let dataTable = global.google?.visualization?.arrayToDataTable?.( data );
			if ( ! dataTable ) {
				return;
			}

			if ( selectedStats.length > 0 ) {
				const dataView = new global.google.visualization.DataView( dataTable );
				if ( ! singleStat ) {
					dataView.setColumns(
						[ 0, ...selectedStats.map( ( stat ) => stat + 1 ) ]
					);
				}
				dataTable = dataView;
			}

			if ( chart ) {
				chart.draw( dataTable, options );
				if ( chartID && GoogleChart.charts.has( chartID ) ) {
					GoogleChart.charts.get( chartID ).dataTable = dataTable;
				}
			}
		};

		const resize = debounce( drawChart, 100 );
		global.addEventListener( 'resize', resize );

		drawChart();

		return () => {
			global.removeEventListener( 'resize', resize );
		};
	}, [
		chart,
		selectedStats,
		singleStat,
		chartID,
		data,
		options,
	] );

	useEffect( () => {
		const interval = setInterval( () => {
			if (
				!! global.google?.visualization?.AreaChart &&
				!! global.google?.visualization?.PieChart &&
				!! global.google?.visualization?.LineChart
			) {
				clearInterval( interval );
				setLoading( false );
				setVisualizationLoaded( true );
			}
		}, 50 );

		return () => {
			if ( chartID && GoogleChart.charts.has( chartID ) ) {
				const {
					chart: googleChart,
					onSelect: selectListener,
					onReady: readyListener,
					onMouseOver: mouseOverListener,
					onMouseOut: mouseOutListener,
				} = GoogleChart.charts.get( chartID );

				if ( googleChart ) {
					global.google.visualization.events.removeListener( selectListener );
					global.google.visualization.events.removeListener( readyListener );
					global.google.visualization.events.removeListener( mouseOverListener );
					global.google.visualization.events.removeListener( mouseOutListener );

					googleChart.clearChart();
				}

				GoogleChart.charts.delete( chartID );
			}

			clearInterval( interval );
		};
	}, [] );

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
	chartID: PropTypes.string,
	chartType: PropTypes.oneOf( [ 'area', 'pie', 'line' ] ).isRequired,
	className: PropTypes.string,
	data: PropTypes.arrayOf( PropTypes.array ),
	loadCompressed: PropTypes.bool,
	loadSmall: PropTypes.bool,
	loadHeight: PropTypes.number,
	loadText: PropTypes.bool,
	onReady: PropTypes.func,
	selectedStats: PropTypes.arrayOf( PropTypes.number ),
	singleStat: PropTypes.bool,
};

GoogleChart.defaultProps = {
	className: '',
	data: [],
	loadCompressed: false,
	loadSmall: false,
	loadHeight: null,
	loadText: true,
	selectedStats: [],
	singleStat: true,
};

GoogleChart.charts = new Map();
