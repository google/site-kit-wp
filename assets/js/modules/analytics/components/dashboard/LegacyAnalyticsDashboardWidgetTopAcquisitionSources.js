/**
 * LegacyAnalyticsDashboardWidgetTopAcquisitionSources component.
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
import { __, _n, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	getTimeInSeconds,
	numFmt,
} from '../../../../util';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData } from '../../../../components/data-table';
import PreviewTable from '../../../../components/PreviewTable';
import MiniChart from '../../../../components/MiniChart';
import { trafficSourcesReportDataDefaults, isDataZeroForReporting } from '../../util';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
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

	const currentDayCount = getCurrentDateRangeDayCount( dateRange );
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
			tooltip: sprintf(
				/* translators: %s: number of days */
				_n( 'Number of new users to visit your page over last %s day', 'Number of new users to visit your page over last %s days', currentDayCount, 'google-site-kit', ),
				currentDayCount,
			),
		},
		{
			title: __( 'Sessions', 'google-site-kit' ),
			tooltip: sprintf(
				/* translators: %s: number of days */
				_n( 'Number of sessions users had on your website over last %s day', 'Number of sessions users had on your website over last %s days', currentDayCount, 'google-site-kit', ),
				currentDayCount,
			),
		},
		{
			title: __( 'Percentage', 'google-site-kit' ),
			tooltip: __( 'Percentage of sessions', 'google-site-kit' ),
		},
	];
	const totalUsers = data[ 0 ].data.totals[ 0 ].values[ 1 ];

	const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
		const change = row.metrics[ 0 ].values[ 1 ] / totalUsers;

		return [
			row.dimensions[ 0 ],
			numFmt( row.metrics[ 0 ].values[ 0 ], { style: 'decimal' } ),
			numFmt( row.metrics[ 0 ].values[ 1 ], { style: 'decimal' } ),
			numFmt( row.metrics[ 0 ].values[ 2 ], { style: 'decimal' } ),
			(
				<Fragment key={ 'minichart-analytics-top-as-' + i }>
					<div className="googlesitekit-table__body-item-chart-wrap">
						{ numFmt( change, '%' ) }
						<MiniChart change={ change } index={ i } />
					</div>
				</Fragment>
			),
		];
	} );

	const options = {
		hideHeader: false,
		chartsEnabled: false,
	};

	const dataTable = getDataTableFromData( dataMapped, headers, options );

	return (
		<div className="googlesitekit-details-widget">
			{ dataTable }
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
