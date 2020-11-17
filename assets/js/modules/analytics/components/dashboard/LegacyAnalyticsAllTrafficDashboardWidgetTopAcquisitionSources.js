/**
 * LegacyAnalyticsAllTrafficDashboardWidgetTopAcquisitionSources component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getTimeInSeconds } from '../../../../util';
import withData from '../../../../components/higherorder/withdata';
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData } from '../../../../components/data-table';
import MiniChart from '../../../../components/MiniChart';
import PreviewTable from '../../../../components/PreviewTable';
import { trafficSourcesReportDataDefaults } from '../../util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';

class LegacyAnalyticsAllTrafficDashboardWidgetTopAcquisitionSources extends Component {
	render() {
		const { data } = this.props;
		if ( ! data || ! data.length ) {
			return null;
		}
		if ( ! Array.isArray( data[ 0 ].data.totals ) || ! data[ 0 ].data.totals.length ) {
			return null;
		}
		if ( ! Array.isArray( data[ 0 ].data.rows ) || ! data[ 0 ].data.rows.length ) {
			return null;
		}

		const headers = [
			{
				title: __( 'Source', 'google-site-kit' ),
				primary: true,
			},
			{
				title: __( 'Percent', 'google-site-kit' ),
			},
		];

		const totalUsers = data[ 0 ].data.totals[ 0 ].values[ 1 ];

		const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
			const percent = ( row.metrics[ 0 ].values[ 1 ] / totalUsers * 100 );

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
	LegacyAnalyticsAllTrafficDashboardWidgetTopAcquisitionSources,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: trafficSourcesReportDataDefaults,
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
