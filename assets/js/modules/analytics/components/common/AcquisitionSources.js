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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getDataTableFromData, TableOverflowContainer } from '../../../../components/data-table';
import MiniChart from '../../../../components/mini-chart';

function AcquisitionSources( { data } ) {
	if ( ! data ) {
		return null;
	}

	const hasTotals = Array.isArray( data[ 0 ].data.totals ) && data[ 0 ].data.totals.length;
	const hasRows = Array.isArray( data[ 0 ].data.rows ) && data[ 0 ].data.rows.length;
	if ( ! hasTotals || ! hasRows ) {
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

	const totalUsers = data[ 0 ].data.totals[ 0 ].values[ 0 ];
	const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
		const percent = ( row.metrics[ 0 ].values[ 0 ] / totalUsers * 100 );

		return [
			row.dimensions[ 0 ],
			<div key={ `minichart-${ i }` } className="googlesitekit-table__body-item-chart-wrap">
				{
					/* translators: %1$s: acquisition source percentage */
					sprintf( __( '%1$s%%', 'google-site-kit' ), percent.toFixed( 2 ) )
				}
				<MiniChart percent={ percent.toFixed( 1 ) } index={ i } />
			</div>,
		];
	} );

	const options = {
		hideHeader: true,
		chartsEnabled: true,
	};

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
};

export default AcquisitionSources;
