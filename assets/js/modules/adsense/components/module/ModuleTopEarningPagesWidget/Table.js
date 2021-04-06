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
import { MODULES_ADSENSE } from '../../../datastore/constants';
import { numFmt } from '../../../../../util';
const { useSelect } = Data;

export default function Table( { report } ) {
	const tableColumns = [
		{
			title: __( 'Page Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			Component: ( { row } ) => {
				const [ title, url ] = row.dimensions;
				const serviceURL = useSelect( ( select ) => select( MODULES_ADSENSE ).getServiceReportURL( 'content-pages', {
					'explorer-table.plotKeys': '[]',
					'_r.drilldown': `analytics.pagePath:${ url }`,
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
			Component: ( { fieldValue } ) => numFmt(
				fieldValue,
				{
					style: 'decimal',
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}
			),
		},
		{
			title: __( 'Page RPM', 'google-site-kit' ),
			description: __( 'Page RPM', 'google-site-kit' ),
			field: 'metrics.0.values.1',
			Component: ( { fieldValue } ) => numFmt(
				fieldValue,
				{
					style: 'decimal',
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}
			),
		},
		{
			title: __( 'Impressions', 'google-site-kit' ),
			description: __( 'Impressions', 'google-site-kit' ),
			field: 'metrics.0.values.2',
			Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
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
	report: PropTypes.object.isRequired,
};
