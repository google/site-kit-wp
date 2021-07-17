/**
 * Table component for the ModuleTopEarningPagesWidget widget.
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
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ReportTable from '../../../../../components/ReportTable';
import TableOverflowContainer from '../../../../../components/TableOverflowContainer';
import Link from '../../../../../components/Link';
import { MODULES_ANALYTICS, DATE_RANGE_OFFSET } from '../../../../analytics/datastore/constants';
import { STORE_NAME } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { getCurrencyFormat } from '../../../util/currency';
import { generateDateRangeArgs } from '../../../../analytics/util/report-date-range-args';
import { numFmt } from '../../../../../util';
const { useSelect } = Data;

export default function Table( { report } ) {
	const currencyFormat = useSelect( ( select ) => {
		const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const adsenseData = select( STORE_NAME ).getReport( {
			startDate,
			endDate,
			metrics: 'ESTIMATED_EARNINGS',
		} );
		return getCurrencyFormat( adsenseData );
	} );

	const tableColumns = [
		{
			title: __( 'Page Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			Component: ( { row } ) => {
				const [ title, url ] = row.dimensions;
				const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
					offsetDays: DATE_RANGE_OFFSET,
				} ) );

				const serviceURL = useSelect( ( select ) => select( MODULES_ANALYTICS ).getServiceReportURL( 'content-pages', {
					'explorer-table.plotKeys': '[]',
					'_r.drilldown': `analytics.pagePath:${ url }`,
					...generateDateRangeArgs( dateRange ),
				} ) );
				return (
					<Link
						href={ serviceURL }
						external
						inherit
					>
						{ title }
					</Link>
				);
			},
		},
		{
			title: __( 'Earnings', 'google-site-kit' ),
			description: __( 'Earnings', 'google-site-kit' ),
			field: 'metrics.0.values.0',
			Component: ( { fieldValue } ) => (
				<span>
					{ numFmt( fieldValue, currencyFormat ) }
				</span>
			),
		},
		{
			title: __( 'Page RPM', 'google-site-kit' ),
			description: __( 'Page RPM', 'google-site-kit' ),
			field: 'metrics.0.values.1',
			Component: ( { fieldValue } ) => (
				<span>
					{ numFmt( fieldValue, currencyFormat ) }
				</span>
			),
		},
		{
			title: __( 'Impressions', 'google-site-kit' ),
			description: __( 'Impressions', 'google-site-kit' ),
			field: 'metrics.0.values.2',
			Component: ( { fieldValue } ) => (
				<span>
					{ numFmt( fieldValue, { style: 'decimal' } ) }
				</span>
			),
		},
	];

	return (
		<TableOverflowContainer>
			<ReportTable
				rows={ report[ 0 ].data.rows }
				columns={ tableColumns }
			/>
		</TableOverflowContainer>
	);
}

Table.propTypes = {
	report: PropTypes.arrayOf( PropTypes.object ).isRequired,
};
