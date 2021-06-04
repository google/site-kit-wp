/**
 * SearchConsoleDashboardWidgetSiteStats component.
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { decodeHTMLEntity, getTimeInSeconds } from '../../../../util';
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import GoogleChart from '../../../../components/GoogleChart';
import PreviewBlock from '../../../../components/PreviewBlock';
import { extractSearchConsoleDashboardData } from '../../util';

class LegacySearchConsoleDashboardWidgetSiteStats extends Component {
	constructor( props ) {
		super( props );

		this.setOptions = this.setOptions.bind( this );
	}

	setOptions() {
		const { selectedStats, series, vAxes } = this.props;
		const { pageTitle } = global._googlesitekitLegacyData;

		let title = __( 'Search Traffic Summary', 'google-site-kit' );

		if ( pageTitle && pageTitle.length ) {
			/* translators: %s: page title */
			title = sprintf( __( 'Search Traffic Summary for %s', 'google-site-kit' ), decodeHTMLEntity( pageTitle ) );
		}

		const options = {
			chart: {
				title,
			},
			curveType: 'line',
			height: 270,
			width: '100%',
			chartArea: {
				height: '77%',
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
			},
		};

		options.series = series;
		options.vAxes = vAxes;

		if ( selectedStats.length < 3 ) {
			options.vAxis.textStyle = {
				color: '#616161',
				fontSize: 12,
			};
			options.vAxis.titleTextStyle = {
				color: '#616161',
				fontSize: 12,
				italic: false,
			};
		} else {
			// Clean up chart if three or more stats are selected.
			options.vAxis.gridlines.color = '#fff';
			options.vAxis.minorGridlines.color = '#fff';
			options.chartArea.width = '98%';
		}

		return options;
	}

	render() {
		const { data, selectedStats, dateRangeLength } = this.props;

		if ( ! data || ! data.length ) {
			return null;
		}

		const options = this.setOptions();
		const processedData = extractSearchConsoleDashboardData( data, dateRangeLength );

		return (
			<section className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
						<GoogleChart
							chartType="LineChart"
							data={ processedData.dataMap }
							options={ options }
							selectedStats={ selectedStats }
						/>
					</div>
				</div>
			</section>
		);
	}
}

export default withData(
	LegacySearchConsoleDashboardWidgetSiteStats,
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
