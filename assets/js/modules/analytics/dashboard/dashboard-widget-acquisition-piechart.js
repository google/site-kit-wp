/**
 * DashboardAcquisitionPieChart component.
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
import GoogleChart from 'GoogleComponents/google-chart.js';
import { getSiteKitAdminURL, getTimeInSeconds } from 'GoogleUtil';
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
/**
 * Internal dependencies
 */
import PropTypes from 'prop-types';
import Link from 'GoogleComponents/link';
import PreviewBlock from 'GoogleComponents/preview-block';
import { extractAnalyticsDataForTrafficChart, getAnalyticsErrorMessageFromData, trafficSourcesReportDataDefaults, isDataZeroForReporting } from '../util';

const { Component } = wp.element;
const { __, _x } = wp.i18n;

class DashboardAcquisitionPieChart extends Component {
	render() {
		const {
			data,
			source,
		} = this.props;

		if ( ! data || data.error || ! data.length ) {
			return null;
		}

		const processedData = extractAnalyticsDataForTrafficChart( data );
		const options = {
			chartArea: {
				width: '100%',
				height: '100%',
			},
			backgroundColor: 'transparent',
			height: 250,
			legend: {
				alignment: 'center',
				textStyle: {
					color: '#5b5b61',
					fontSize: 12,
				},
			},
			slices: {
				0: { color: '#178EC5' },
				1: { color: '#54B23B' },
				2: { color: '#EB5729' },
				3: { color: '#ECED33' },
				4: { color: '#34CBE3' },
				5: { color: '#82E88E' },
			},
			title: null,
			width: '100%',
		};

		return (
			<div className="googlesitekit-chart googlesitekit-chart--pie">
				<GoogleChart
					data={ processedData }
					options={ options }
					chartType="pie"
					id="overview-piechart"
					loadHeight={ 205 }
				/>
				{ source &&
					<div className="googlesitekit-chart__source">
						{ [
							__( 'Source:', 'google-site-kit' ),
							' ',
							<Link
								key="link"
								href={ getSiteKitAdminURL( 'googlesitekit-module-analytics' ) }
								inherit
							>
								{ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
							</Link>,
						] }
					</div>
				}
			</div>
		);
	}
}

DashboardAcquisitionPieChart.defaultProps = {
	source: false,
};

DashboardAcquisitionPieChart.propTypes = {
	source: PropTypes.bool,
};

export default withData(
	DashboardAcquisitionPieChart,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: {
				...trafficSourcesReportDataDefaults,
				url: googlesitekit.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Dashboard', 'Single' ],
		},
	],
	<PreviewBlock width="282px" height="282px" shape="circular" />,
	{},
	isDataZeroForReporting,
	getAnalyticsErrorMessageFromData
);
