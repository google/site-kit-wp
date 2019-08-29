/**
 * AnalyticsDashboardWidgetTopAcquisitionSources component.
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
import {
	getTimeInSeconds,
	numberFormat,
	getDateRangeFrom,
} from 'GoogleUtil';
import { getDataTableFromData, TableOverflowContainer } from 'GoogleComponents/data-table';
import PreviewTable from 'GoogleComponents/preview-table';
import MiniChart from 'GoogleComponents/mini-chart';

const { __, sprintf } = wp.i18n;
const { map } = lodash;
const { Component, Fragment } = wp.element;

class AnalyticsDashboardWidgetTopAcquisitionSources extends Component {
	render() {
		const { data } = this.props;
		if ( ! data || ! data.length ) {
			return null;
		}

		const { dateRangeFrom } = getDateRangeFrom();

		const headers = [
			{
				title: __( 'Medium', 'google-site-kit' ),
				tooltip: __( 'Medium refers to where your traffic originated from', 'google-site-kit' ),
			},
			{
				title: __( 'Users', 'google-site-kit' ),
				tooltip: __( 'Number of users that originated from that traffic', 'google-site-kit' ),
			},
			{
				title: __( 'New Users', 'google-site-kit' ),
				tooltip: sprintf( __( 'Number of new users to visit your page over %s', 'google-site-kit' ), dateRangeFrom ),
			},
			{
				title: __( 'Sessions', 'google-site-kit' ),
				tooltip: sprintf( __( 'Number of sessions users had on your website over %s', 'google-site-kit' ), dateRangeFrom ),
			},
			{
				title: __( 'Percentage', 'google-site-kit' ),
				tooltip: __( 'Percentage of sessions', 'google-site-kit' ),
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
				numberFormat( row.metrics[ 0 ].values[ 0 ] ),
				numberFormat( row.metrics[ 0 ].values[ 1 ] ),
				numberFormat( row.metrics[ 0 ].values[ 2 ] ),
				<Fragment key={ 'minichart-analytics-top-as-' + i }><div className="googlesitekit-table__body-item-chart-wrap">{ `${ percent.toFixed( 2 ) }%` } <MiniChart percent={ percent.toFixed( 1 ) } index={ i } /></div></Fragment>,
			];
		} );

		const options = {
			hideHeader: false,
			chartsEnabled: false,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			<div className="googlesitekit-details-widget">
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			</div>
		);
	}
}

export default withData(
	AnalyticsDashboardWidgetTopAcquisitionSources,
	[
		{
			type: 'modules',
			identifier: 'analytics',
			datapoint: 'traffic-sources',
			data: {
				permaLink: googlesitekit.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	<PreviewTable
		rows={ 4 }
		rowHeight={ 50 }
	/>
);
