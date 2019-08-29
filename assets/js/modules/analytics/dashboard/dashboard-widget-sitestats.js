/**
 * AnalyticsDashboardWidgetSiteStats component.
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
import GoogleChart from 'GoogleComponents/google-chart';
import {
	getTimeInSeconds,
} from 'GoogleUtil';
import withData from 'GoogleComponents/higherorder/withdata';
/**
 * Internal dependencies
 */
import { extractAnalyticsDashboardData } from '../util';
import PreviewBlock from 'GoogleComponents/preview-block';

const { __ } = wp.i18n;
const { Component } = wp.element;

class AnalyticsDashboardWidgetSiteStats extends Component {
	constructor( props ) {
		super( props );

		this.setOptions = this.setOptions.bind( this );
	}

	setOptions() {
		const { series, vAxes } = this.props;

		const pageTitle = '' === googlesitekit.pageTitle ? '' : __( 'Users Traffic Summary', 'google-site-kit' );

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

		return options;
	}

	render() {
		const { data, selectedStats, dateRangeFrom } = this.props;

		if ( ! data || ! data.length ) {
			return null;
		}

		const days = dateRangeFrom ? dateRangeFrom.match( /\d+/ ).map( Number )[ 0 ] : 28;
		const dataMap = extractAnalyticsDashboardData( data, selectedStats, days );

		if ( ! dataMap ) {
			return null;
		}

		const options = this.setOptions();

		return (
			<section className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
						<GoogleChart
							selectedStats={ selectedStats }
							data={ dataMap }
							options={ options }
						/>
					</div>
				</div>
			</section>
		);
	}
}

export default withData(
	AnalyticsDashboardWidgetSiteStats,
	[
		{
			type: 'modules',
			identifier: 'analytics',
			datapoint: 'site-analytics',
			data: {},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Single',
		},
	],
	<PreviewBlock width="100%" height="270px" padding />,
	{ createGrid: true }
);
