/**
 * AnalyticsDashboardWidgetTopPagesTable component.
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
import { getTimeInSeconds, numberFormat } from '../../../../util';
import withData from '../../../../components/higherorder/withdata';
import { STORE_NAME as MODULES_ANALYTICS } from '../../datastore/constants';
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData } from '../../../../components/data-table';
import PreviewTable from '../../../../components/PreviewTable';
import { getTopPagesReportDataDefaults } from '../../util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import Link from '../../../../components/Link';
const { withSelect } = Data;

const AnalyticsDashboardWidgetTopPagesTable = ( props ) => {
	const { data, colspan } = props;

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
		const percent = Number( row.metrics[ 0 ].values[ 2 ] );
		const [ title, url ] = row.dimensions;
		links[ i ] = url;

		return [
			title,
			numberFormat( row.metrics[ 0 ].values[ 0 ] ),
			numberFormat( row.metrics[ 0 ].values[ 1 ] ),
			<div className="googlesitekit-table__body-item-chart-wrap" key={ 'minichart-' + i }>{ `${ percent.toFixed( 2 ) }%` }</div>,
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
