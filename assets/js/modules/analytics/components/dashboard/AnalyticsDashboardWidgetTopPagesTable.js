/**
 * AnalyticsDashboardWidgetTopPagesTable component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { getTimeInSeconds, numFmt } from '../../../../util';
import withData from '../../../../components/higherorder/withData';
<<<<<<< HEAD
import { MODULES_ANALYTICS } from '../../datastore/constants';
=======
import { STORE_NAME as MODULES_ANALYTICS, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
>>>>>>> Add new generateDateRangeArgs function; pass to analytics widgets that use the Widget API.
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData } from '../../../../components/data-table';
import PreviewTable from '../../../../components/PreviewTable';
import { getTopPagesReportDataDefaults } from '../../util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import Link from '../../../../components/Link';
const { useSelect, withSelect } = Data;
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const AnalyticsDashboardWidgetTopPagesTable = ( props ) => {
	const { data, colspan } = props;
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	if ( ! data || ! data.length ) {
		return null;
	}

	if ( ! Array.isArray( data[ 0 ].data.rows ) ) {
		return null;
	}

	const headers = [
		{
			title: __( 'Title', 'google-site-kit' ),
			tooltip: __( 'Page Title', 'google-site-kit' ),
			primary: true,
		},
		{
			title: __( 'Pageviews', 'google-site-kit' ),
			tooltip: __( 'Pageviews', 'google-site-kit' ),
		},
		{
			title: __( 'Unique Pageviews', 'google-site-kit' ),
			tooltip: __( 'Unique Pageviews', 'google-site-kit' ),
		},
		{
			title: __( 'Bounce Rate', 'google-site-kit' ),
			tooltip: __( 'Bounce Rate', 'google-site-kit' ),
		},
	];

	const links = [];
	const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
		const percent = Number( row.metrics[ 0 ].values[ 2 ] ) / 100;
		const [ title, url ] = row.dimensions;
		links[ i ] = url;

		return [
			title,
			numFmt( row.metrics[ 0 ].values[ 0 ], { style: 'decimal' } ),
			numFmt( row.metrics[ 0 ].values[ 1 ], { style: 'decimal' } ),
			(
				<div className="googlesitekit-table__body-item-chart-wrap" key={ 'minichart-' + i }>
					{ numFmt( percent, '%' ) }
				</div>
			),
		];
	} );

	const options = {
		hideHeader: false,
		chartsEnabled: false,
		links,
		hideColumns: {
			mobile: [ 2, 3 ],
		},
		PrimaryLink: withSelect( ( select, { href = '/' } ) => {
			const serviceURL = select( MODULES_ANALYTICS ).getServiceReportURL( 'content-drilldown', {
				'explorer-table.plotKeys': '[]',
				'_r.drilldown': `analytics.pagePath:${ href }`,
				...generateDateRangeArgs( dateRangeDates ),
			} );

			return {
				href: serviceURL,
				external: true,
			};
		} )( Link ),
	};

	const dataTable = getDataTableFromData( dataMapped, headers, options );

	return (
		<div className={ classnames(
			'mdc-layout-grid__cell',
			`mdc-layout-grid__cell--span-${ colspan }`
		) }>
			zoe mamaa
			<TableOverflowContainer>
				{ dataTable }
			</TableOverflowContainer>
		</div>

	);
};

AnalyticsDashboardWidgetTopPagesTable.propTypes = {
	data: PropTypes.array,
	colspan: PropTypes.number,
};

AnalyticsDashboardWidgetTopPagesTable.defaultProps = {
	data: null,
	colspan: 12,
};

export default withData(
	AnalyticsDashboardWidgetTopPagesTable,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: getTopPagesReportDataDefaults(),
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	<PreviewTable padding />,
	{ createGrid: true }
);
