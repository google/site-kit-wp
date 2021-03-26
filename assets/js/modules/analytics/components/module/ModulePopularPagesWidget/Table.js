/**
 * Table component of the ModulePopularPagesWidget widget.
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
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET, MODULES_ANALYTICS } from '../../../datastore/constants';
import TableOverflowContainer from '../../../../../components/TableOverflowContainer';
import Link from '../../../../../components/Link';
import { numFmt } from '../../../../../util';
import { generateDateRangeArgs } from '../../../util/report-date-range-args';
import ReportTable from '../../../../../components/ReportTable';
const { useSelect } = Data;

export default function Table( { report } ) {
	const tableColumns = [
		{
			title: __( 'Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			Component: ( { row } ) => {
				const [ title, url ] = row.dimensions;
				const serviceURL = useSelect( ( select ) => {
					const dateRangeDates = select( CORE_USER ).getDateRangeDates( {
						offsetDays: DATE_RANGE_OFFSET,
					} );
					return select( MODULES_ANALYTICS ).getServiceReportURL( 'content-drilldown', {
						'explorer-table.plotKeys': '[]',
						'_r.drilldown': `analytics.pagePath:${ url }`,
						...generateDateRangeArgs( dateRangeDates ),
					} );
				} );
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
			title: __( 'Pageviews', 'google-site-kit' ),
			description: __( 'Pageviews', 'google-site-kit' ),
			field: 'metrics.0.values.0',
			Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
		},
		{
			title: __( 'Unique Pageviews', 'google-site-kit' ),
			description: __( 'Unique Pageviews', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metrics.0.values.1',
			Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
		},
		{
			title: __( 'Bounce Rate', 'google-site-kit' ),
			description: __( 'Bounce Rate', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metrics.0.values.2',
			Component: ( { fieldValue } ) => numFmt( Number( fieldValue ) / 100, '%' ),
		},
	];

	if ( ! Array.isArray( report ) || ! report.length || ! report[ 0 ].data || ! report[ 0 ].data.rows ) {
		return null;
	}

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
