/**
 * LegacyAnalyticsDashboardWidgetPopularPagesTable component.
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
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getTimeInSeconds, numberFormat, getModulesData } from '../../../../util';
import { isDataZeroForReporting, getTopPagesReportDataDefaults } from '../../util';
import withData from '../../../../components/higherorder/withdata';
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData, TableOverflowContainer } from '../../../../components/data-table';
import PreviewTable from '../../../../components/preview-table';
import Layout from '../../../../components/layout/layout';

class LegacyAnalyticsDashboardWidgetPopularPagesTable extends Component {
	static renderLayout( component ) {
		return (
			<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-6-desktop
				mdc-layout-grid__cell--span-4-tablet
			">
				<Layout
					className="googlesitekit-popular-content"
					footer
					footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					footerCtaLink={ getModulesData().analytics.homepage }
					fill
				>
					{ component }
				</Layout>
			</div>
		);
	}

	render() {
		const { data } = this.props;

		if ( ! data || ! data.length ) {
			return null;
		}

		if ( ! Array.isArray( data[ 0 ].data.rows ) ) {
			return null;
		}

		const headers = [
			{
				title: __( 'Most popular content', 'google-site-kit' ),
				primary: true,
			},
			{
				title: __( 'Views', 'google-site-kit' ),
			},
		];

		const links = [];
		const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
			const [ title, url ] = row.dimensions;
			links[ i ] = url.startsWith( '/' ) ? url : '/' + url;

			return [
				title,
				numberFormat( row.metrics[ 0 ].values[ 0 ] ),
			];
		} );

		const options = {
			hideHeader: false,
			chartsEnabled: false,
			links,
			showURLs: true,
			useAdminURLs: true,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			LegacyAnalyticsDashboardWidgetPopularPagesTable.renderLayout(
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			)
		);
	}
}

export default withData(
	LegacyAnalyticsDashboardWidgetPopularPagesTable,
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
	LegacyAnalyticsDashboardWidgetPopularPagesTable.renderLayout(
		<PreviewTable padding />
	),
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZeroForReporting
);
