/**
 * SearchConsoleDashboardWidgetSiteStats component.
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
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
import GoogleChart from 'GoogleComponents/google-chart.js';
import PreviewBlock from 'GoogleComponents/preview-block';
import { decodeHtmlEntity, getTimeInSeconds } from 'GoogleUtil';

/**
 * Internal dependencies
 */
import { extractSearchConsoleDashboardData } from './util';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

class SearchConsoleDashboardWidgetSiteStats extends Component {
	constructor( props ) {
		super( props );

		this.setOptions = this.setOptions.bind( this );
	}

	setOptions() {
		const { selectedStats, series, vAxes } = this.props;

		const pageTitle = googlesitekit.pageTitle && googlesitekit.pageTitle.length ? sprintf( __( 'Search Traffic Summary for %s', 'google-site-kit' ), decodeHtmlEntity( googlesitekit.pageTitle ) ) : __( 'Search Traffic Summary', 'google-site-kit' );

		const options = {
			chart: {
				title: pageTitle,
			},
			curveType: 'line',
			height: 270,
			width: '100%',
			chartArea: {
				height: '80%',
				width: '87%',
			},
			legend: {
				position: 'top',
				textStyle: {
					color: '#616161',
					fontSize: 12,
				},
			},
			hAxis: {
				format: 'M/d/yy',
				gridlines: {
					color: '#fff',
				},
				textStyle: {
					color: '#616161',
					fontSize: 12,
				},
			},
			vAxis: {
				gridlines: {
					color: '#eee',
				},
				minorGridlines: {
					color: '#eee',
				},
				textStyle: {
					color: '#616161',
					fontSize: 12,
				},
				titleTextStyle: {
					color: '#616161',
					fontSize: 12,
					italic: false,
				},
			},
		};

		options.series = series;
		options.vAxes = vAxes;

		// Clean up chart if more than three stats are selected.
		if ( 3 <= selectedStats.length ) {
			options.vAxis.textPosition = 'none';
			options.vAxis.gridlines.color = '#fff';
			options.vAxis.minorGridlines.color = '#fff';
			options.chartArea.width = '98%';
		}

		return options;
	}

	render() {
		const { data, selectedStats } = this.props;

		if ( ! data || ! data.length ) {
			return null;
		}

		const options = this.setOptions();
		const processedData = extractSearchConsoleDashboardData( data );

		return (
			<section className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
						<GoogleChart
							selectedStats={ selectedStats }
							data={ processedData.dataMap }
							options={ options }
							singleStat={ false }
						/>
					</div>
				</div>
			</section>
		);
	}
}

export default withData(
	SearchConsoleDashboardWidgetSiteStats,
	[
		{
			type: TYPE_MODULES,
			identifier: 'search-console',
			datapoint: 'searchanalytics',
			data: {
				dimensions: 'date',
				compareDateRanges: true,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Single',
		},
	],
	<PreviewBlock width="100%" height="270px" padding />,
	{ createGrid: true }
);
