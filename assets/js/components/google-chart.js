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

import ProgressBar from 'GoogleComponents/progress-bar';
import PropTypes from 'prop-types';

const { __ } = wp.i18n;
const { Component, createRef } = wp.element;
const { doAction, addAction } = wp.hooks;
const { debounce } = lodash;

class GoogleChart extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			loading: true,
			chart: null,
		};

		this.waitForChart = this.waitForChart.bind( this );
		this.getData = this.getData.bind( this );
		this.prepareChart = this.prepareChart.bind( this );
		this.drawChart = this.drawChart.bind( this );
		this.updateChart = this.updateChart.bind( this );
		this.chartRef = createRef();

		// Inject the script if not already loaded.
		if ( ! window.google && ! window.googleChartLoaded ) {
			window.googleChartLoaded = true;
			const script = document.createElement( 'script' );
			script.type = 'text/javascript';
			script.onload = () => {

				// Cleanup onload handler
				script.onload = null;

				// Initialize charts.
				window.google.charts.load( 'visualization', '1', {
					'packages': [ 'corechart' ]
				} );

				window.google.charts.setOnLoadCallback( () => {
					this.getData();
					this.prepareChart();
					this.drawChart();
					this.setState( { loading: false } );
				} );

				doAction( 'googlesitekit.ChartLoaderLoaded' );
			};

			// Add the script to the DOM
			( document.getElementsByTagName( 'head' )[0] ).appendChild( script );

			// Set the `src` to begin transport
			script.src = 'https://www.gstatic.com/charts/loader.js';
		} else {

			// When the google chart object not loaded, load draw chart later.
			if ( ! window.google || ! window.google.charts ) {
				addAction( 'googlesitekit.ChartLoaderLoaded', 'googlesitekit.HandleChartLoaderLoaded', () => {
					window.google.charts.setOnLoadCallback( () => {
						this.getData();
						this.prepareChart();
						this.drawChart();
					} );
				} );
			} else {

				// When the google chart object loaded, draw chart now.
				window.google.charts.setOnLoadCallback( () => {
					this.getData();
					this.prepareChart();
					this.drawChart();
				} );
			}

		}
	}

	componentDidMount() {
		const self = this;

		this.resize = debounce( function() {
			self.drawChart();
		}, 100 );

		window.addEventListener( 'resize', this.resize );
	}

	componentDidUpdate( prevProps ) {
		const { selectedStats } = this.props;

		if ( 0 !== selectedStats.length && JSON.stringify( selectedStats ) !== JSON.stringify( prevProps.selectedStats ) ) {
			this.updateChart();
		}
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.resize );
	}

	waitForChart( callback ) {
		setTimeout( () => {
			callback();
		}, 500 );
	}

	getData() {
		return window.google && window.google.visualization && window.google.visualization.arrayToDataTable(
			this.props.data
		);
	}

	prepareChart() {
		if ( ! window.google ) {
			this.waitForChart( this.prepareChart );
			return;
		}

		const element = this.chartRef.current;
		const { chartType } = this.props;

		const googleChart = 'pie' === chartType ? new window.google.visualization.PieChart( element ) : new window.google.visualization.LineChart( element );

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

		const view = new window.google.visualization.DataView( data );

		if ( ! singleStat ) {
			let setStats = [ 0 ]; // Default date data, required.
			setStats = setStats.concat(
				selectedStats.map( stat => {
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
