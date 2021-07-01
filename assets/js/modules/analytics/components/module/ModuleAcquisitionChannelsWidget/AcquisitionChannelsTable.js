/**
 * Table component.
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
import Data from 'googlesitekit-data';
import { numFmt } from '../../../../../util';
import MiniChart from '../../../../../components/MiniChart';
import ReportTable from '../../../../../components/ReportTable';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

export default function AcquisitionChannelsTable( { report } ) {
	const dateRangeNumberOfDays = useSelect( ( select ) => select( CORE_USER ).getDateRangeNumberOfDays() );

	const totalUsers = report[ 0 ].data.totals[ 0 ].values[ 1 ];
	let iterator = -1; // We pre-increment, hence starting at -1.

	const tableColumns = [
		{
			title: __( 'Channel', 'google-site-kit' ),
			tooltip: __( 'Channel refers to where your traffic originated from', 'google-site-kit' ),
			Component: ( { row } ) => <span>{ row.dimensions[ 0 ] }</span>,
		},
		{
			title: __( 'Users', 'google-site-kit' ),
			tooltip: __( 'Number of users that originated from that traffic', 'google-site-kit' ),
			field: 'metrics.0.values.0',
			Component: ( { fieldValue } ) => (
				<span>
					{ numFmt( fieldValue, { style: 'decimal' } ) }
				</span>
			),
		},
		{
			title: __( 'New Users', 'google-site-kit' ),
			tooltip: sprintf(
				/* translators: %s: number of days */
				_n( 'Number of new users to visit your page over last %s day', 'Number of new users to visit your page over last %s days', dateRangeNumberOfDays, 'google-site-kit', ),
				dateRangeNumberOfDays,
			),
			field: 'metrics.0.values.1',
			Component: ( { fieldValue } ) => (
				<span>
					{ numFmt( fieldValue, { style: 'decimal' } ) }
				</span>
			),
		},
		{
			title: __( 'Sessions', 'google-site-kit' ),
			tooltip: sprintf(
				/* translators: %s: number of days */
				_n( 'Number of sessions users had on your website over last %s day', 'Number of sessions users had on your website over last %s days', dateRangeNumberOfDays, 'google-site-kit', ),
				dateRangeNumberOfDays,
			),
			field: 'metrics.0.values.2',
			Component: ( { fieldValue } ) => (
				<span>
					{ numFmt( fieldValue, { style: 'decimal' } ) }
				</span>
			),
		},
		{
			title: __( 'Percentage', 'google-site-kit' ),
			tooltip: __( 'Percentage of sessions', 'google-site-kit' ),
			field: 'metrics.0.values.1',
			Component: ( { fieldValue } ) => {
				const change = fieldValue / totalUsers;
				iterator += 1;
				return (
					<div key={ 'minichart-analytics-top-as-' + iterator } className="googlesitekit-table__body-item-chart-wrap">
						{ numFmt( change, '%' ) }
						<MiniChart change={ change } index={ iterator } />
					</div>
				);
			},
		},
	];

	return (
		<div className="googlesitekit-details-widget">
			<ReportTable
				rows={ report[ 0 ].data.rows }
				columns={ tableColumns }
			/>
		</div>
	);
}

AcquisitionChannelsTable.propTypes = {
	report: PropTypes.arrayOf( PropTypes.object ),
};
