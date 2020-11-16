/**
 * DashboardAllTrafficWidget component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getDataTableFromData, TableOverflowContainer } from '../../../../components/data-table';
import MiniChart from '../../../../components/MiniChart';
import { numberFormat } from '../../../../util/i18n';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';

function AcquisitionSources( { data, args } ) {
	if ( ! data ) {
		return null;
	}

	const hasTotals = Array.isArray( data[ 0 ].data.totals ) && data[ 0 ].data.totals.length;
	const hasRows = Array.isArray( data[ 0 ].data.rows ) && data[ 0 ].data.rows.length;
	if ( ! hasTotals || ! hasRows ) {
		return null;
	}

	const options = {
		hideHeader: true,
		chartsEnabled: true,
	};

	let keyColumnIndex = 0;
	let headers = [
		{
			title: __( 'Source', 'google-site-kit' ),
			primary: true,
		},
		{
			title: __( 'Percent', 'google-site-kit' ),
		},
	];

	const { dateRange, url } = args;
	if ( url ) {
		const currentDayCount = getCurrentDateRangeDayCount( dateRange );

		keyColumnIndex = 1;
		options.hideHeader = false;
		options.chartsEnabled = false;

		headers = [
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
	}

	const totalUsers = data[ 0 ].data.totals[ 0 ].values[ keyColumnIndex ];
	const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
		const percent = ( row.metrics[ 0 ].values[ keyColumnIndex ] / totalUsers * 100 );
		const cells = [ row.dimensions[ 0 ] ];

		if ( row.metrics[ 0 ].values.length > 1 ) {
			cells.push( ...row.metrics[ 0 ].values.map( ( value ) => numberFormat( value ) ) );
		}

		cells.push(
			<div key={ `minichart-${ i }` } className="googlesitekit-table__body-item-chart-wrap">
				{
					/* translators: %1$s: acquisition source percentage */
					sprintf( __( '%1$s%%', 'google-site-kit' ), percent.toFixed( 2 ) )
				}
				<MiniChart percent={ percent.toFixed( 1 ) } index={ i } />
			</div>
		);

		return cells;
	} );

	return (
		<div className="googlesitekit-alltraffic-widget">
			<TableOverflowContainer>
				{ getDataTableFromData( dataMapped, headers, options ) }
			</TableOverflowContainer>
		</div>
	);
}

AcquisitionSources.propTypes = {
	data: PropTypes.arrayOf( PropTypes.object ),
	args: PropTypes.shape( {
		url: PropTypes.string,
		dateRange: PropTypes.string,
	} ).isRequired,
};

export default AcquisitionSources;
