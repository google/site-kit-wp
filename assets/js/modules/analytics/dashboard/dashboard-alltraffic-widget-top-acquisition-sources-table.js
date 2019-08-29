/**
 * AnalyticsAllTrafficDashboardWidgetTopAcquisitionSources component.
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
import { getTimeInSeconds } from 'GoogleUtil';
import { getDataTableFromData, TableOverflowContainer } from 'GoogleComponents/data-table';
import MiniChart from 'GoogleComponents/mini-chart';
import PreviewTable from 'GoogleComponents/preview-table';

const { __ } = wp.i18n;
const { map } = lodash;
const { Component, Fragment } = wp.element;

class AnalyticsAllTrafficDashboardWidgetTopAcquisitionSources extends Component {
	render() {
		const { data } = this.props;
		if ( ! data || ! data.length ) {
			return null;
		}

		const headers = [
			{
				title: __( 'Source', 'google-site-kit' ),
			},
			{
				title: __( 'Percent', 'google-site-kit' ),
			},
		];

		const totalSessions = data[ 0 ].data.totals[ 0 ].values[ 0 ];

		const dataMapped = map( data[ 0 ].data.rows, ( row, i ) => {
			const percent = ( row.metrics[ 0 ].values[ 0 ] / totalSessions * 100 );

			// Exclude sources below 1%.
			if ( 1 > percent ) {
				return false;
			}
			return [
				row.dimensions[ 0 ],
				<Fragment key={ 'minichart-' + i }><div className="googlesitekit-table__body-item-chart-wrap">{ `${ percent.toFixed( 2 ) }%` } <MiniChart percent={ percent.toFixed( 1 ) } index={ i } /></div></Fragment>,
			];
		} );

		const options = {
			hideHeader: true,
			chartsEnabled: true,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			<div className="googlesitekit-alltraffic-widget">
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			</div>
		);
	}
}

export default withData(
	AnalyticsAllTrafficDashboardWidgetTopAcquisitionSources,
	[
		{
			type: 'modules',
			identifier: 'analytics',
			datapoint: 'traffic-sources',
			data: {},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
		},
	],
	<PreviewTable
		rows={ 3 }
		rowHeight={ 50 }
	/>
);
