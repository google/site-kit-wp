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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { debounce } from 'lodash';

/**
 * Internal dependencies
 */
import ProgressBar from './progress-bar';

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
			script.src = 'https://www.gstatic.com/charts/loader.js';
		} );
	} else {
		// Charts is already available - resolve immediately.
		chartLoadPromise = Promise.resolve();
	}

	return chartLoadPromise;
}

class GoogleChart extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			loading: true,
			chart: null,
		};

		this.onChartsLoad = this.onChartsLoad.bind( this );
		this.waitForChart = this.waitForChart.bind( this );
		this.getData = this.getData.bind( this );
		this.prepareChart = this.prepareChart.bind( this );
		this.drawChart = this.drawChart.bind( this );
		this.updateChart = this.updateChart.bind( this );
		this.chartRef = createRef();
		this.resize = debounce( this.drawChart, 100 );
	}

	onChartsLoad() {
		this.getData();
		this.prepareChart();
		this.drawChart();
		this.setState( { loading: false } );
	}

	async componentDidMount() {
		await loadCharts();
		global.google.charts.load( 'current', {
			packages: [ 'corechart' ],
		} );
		global.google.charts.setOnLoadCallback( this.onChartsLoad );
		global.addEventListener( 'resize', this.resize );
	}

	componentDidUpdate( prevProps ) {
		const { selectedStats } = this.props;

		if ( 0 !== selectedStats.length && JSON.stringify( selectedStats ) !== JSON.stringify( prevProps.selectedStats ) ) {
			this.updateChart();
		}
	}

	componentWillUnmount() {
		global.removeEventListener( 'resize', this.resize );
	}

	waitForChart( callback ) {
		setTimeout( () => {
			callback();
		}, 500 );
	}

	getData() {
		return global.google && global.google.visualization && global.google.visualization.arrayToDataTable(
			this.props.data
		);
	}

	prepareChart() {
		const element = this.chartRef.current;

		if ( ! global.google || ! element ) {
			this.waitForChart( this.prepareChart );
			return;
		}

		const { chartType } = this.props;
		const googleChart = 'pie' === chartType ? new global.google.visualization.PieChart( element ) : new global.google.visualization.LineChart( element );

		this.setState( { chart: googleChart } );
	}

	drawChart() {
		const { chart } = this.state;
		const { selectedStats, options } = this.props;
		const data = this.getData();

		if ( null === data || null === chart ) {
			this.waitForChart( this.drawChart );
			return;
		}

		chart.draw( data, options );

		if ( 0 !== selectedStats.length ) {
			this.updateChart();
		}
	}

	updateChart() {
		const { chart } = this.state;
		const { selectedStats, options, singleStat } = this.props;
		const data = this.getData();

		if ( null === data || null === chart ) {
			this.waitForChart( this.drawChart );
			return;
		}

		const view = new global.google.visualization.DataView( data );

		if ( ! singleStat ) {
			let setStats = [ 0 ]; // Default date data, required.
			setStats = setStats.concat(
				selectedStats.map( ( stat ) => {
					return stat + 1;
				} )
			);

			view.setColumns( setStats );
		}

		chart.draw( view, options );
	}

	render() {
		const { loading } = this.state;
		const {
			className,
			loadSmall,
			loadCompressed,
			loadHeight,
			loadText,
		} = this.props;

		return (
			<div className="googlesitekit-graph-wrapper">
				<div
					ref={ this.chartRef }
					className="googlesitekit-line-chart"
				>
					<div className="googlesitekit-chart-loading">
						{ loading && <div className="googlesitekit-chart-loading__wrapper">
							{ loadText && <p>{ __( 'Loading chart...', 'google-site-kit' ) }</p> }
							<ProgressBar
								className={ className }
								small={ loadSmall }
								compress={ loadCompressed }
								height={ loadHeight }
							/>
						</div> }
					</div>
				</div>
			</div>
		);
	}
}

GoogleChart.propTypes = {
	selectedStats: PropTypes.array,
	options: PropTypes.object.isRequired,
	id: PropTypes.string,
	singleStat: PropTypes.bool,
	className: PropTypes.string,
	loadSmall: PropTypes.bool,
	loadCompressed: PropTypes.bool,
	loadHeight: PropTypes.number,
	loadText: PropTypes.bool,
};

GoogleChart.defaultProps = {
	selectedStats: [],
	id: '',
	singleStat: true,
	className: '',
	loadSmall: false,
	loadCompressed: false,
	loadHeight: null,
	loadText: true,
};

export default GoogleChart;
