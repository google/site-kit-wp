/**
 * LegacyAnalyticsDashboardWidgetTopAcquisitionSources component.
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
import { __, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	getTimeInSeconds,
	numberFormat,
} from '../../../../util';
import { getCurrentDateRange } from '../../../../util/date-range';
import withData from '../../../../components/higherorder/withdata';
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData, TableOverflowContainer } from '../../../../components/data-table';
import PreviewTable from '../../../../components/PreviewTable';
import MiniChart from '../../../../components/MiniChart';
import { trafficSourcesReportDataDefaults, isDataZeroForReporting } from '../../util';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

function LegacyAnalyticsDashboardWidgetTopAcquisitionSources( { data } ) {
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );

	if ( ! data || ! data.length ) {
		return null;
	}
	if ( ! Array.isArray( data[ 0 ].data.totals ) || ! data[ 0 ].data.totals.length ) {
		return null;
	}
	if ( ! Array.isArray( data[ 0 ].data.rows ) || ! data[ 0 ].data.rows.length ) {
		return null;
	}

	const currentRange = getCurrentDateRange( dateRange );
	const headers = [
		{
			title: __( 'Channel', 'google-site-kit' ),
			tooltip: __( 'Channel refers to where your traffic originated from', 'google-site-kit' ),
		},
		{
			title: __( 'Users', 'google-site-kit' ),
			tooltip: __( 'Number of users that originated from that traffic', 'google-site-kit' ),
		},
		{
			title: __( 'New Users', 'google-site-kit' ),
			/* translators: %s: date range */
			tooltip: sprintf( __( 'Number of new users to visit your page over last %s', 'google-site-kit' ), currentRange ),
		},
		{
			title: __( 'Sessions', 'google-site-kit' ),
			/* translators: %s: date range */
			tooltip: sprintf( __( 'Number of sessions users had on your website over last %s', 'google-site-kit' ), currentRange ),
		},
		{
			title: __( 'Percentage', 'google-site-kit' ),
			tooltip: __( 'Percentage of sessions', 'google-site-kit' ),
		},
	];
	const totalUsers = data[ 0 ].data.totals[ 0 ].values[ 1 ];

	const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
		const percent = ( row.metrics[ 0 ].values[ 1 ] / totalUsers * 100 );

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

export default withData(
	LegacyAnalyticsDashboardWidgetTopAcquisitionSources,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: {
				...trafficSourcesReportDataDefaults,
				url: global._googlesitekitLegacyData.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	<PreviewTable
		rows={ 4 }
		rowHeight={ 50 }
	/>,
	{},
	isDataZeroForReporting
);
