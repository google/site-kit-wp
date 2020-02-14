/**
 * DashboardWidgetPopularKeywordsTable component.
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
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
import { getTimeInSeconds, numberFormat } from 'GoogleUtil';
import { getDataTableFromData, TableOverflowContainer } from 'GoogleComponents/data-table';
import PreviewTable from 'GoogleComponents/preview-table';
import Layout from 'GoogleComponents/layout/layout';
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	isDataZeroSearchConsole,
} from '../dashboard/util';

class DashboardWidgetPopularKeywordsTable extends Component {
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
					footerCtaLabel={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
					footerCtaLink={
						sprintf( 'https://search.google.com/u/1/search-console?resource_id=%s', global.googlesitekit.admin.siteURL )
					}
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

		const headers = [
			{
				title: __( 'Top search queries for your site', 'google-site-kit' ),
				tooltip: __( 'Most searched for keywords related to your content', 'google-site-kit' ),
				primary: true,
			},
			{
				title: __( 'Clicks', 'google-site-kit' ),
				tooltip: __( 'Number of times users clicked on your content in search results', 'google-site-kit' ),
			},
			{
				title: __( 'Impressions', 'google-site-kit' ),
				tooltip: __( 'Counted each time your content appears in search results', 'google-site-kit' ),
			},
		];
		const domain = global.googlesitekit.admin.siteURL;
		const links = [];
		const dataMapped = map( data, ( row, i ) => {
			const query = row.keys[ 0 ];
			links[ i ] = sprintf(
				'https://search.google.com/search-console/performance/search-analytics?resource_id=%s&query=!%s&num_of_days=28',
				domain,
				query
			);
			return [
				query,
				numberFormat( row.clicks ),
				numberFormat( row.impressions ),
			];
		} );

		const options = {
			hideHeader: false,
			chartsEnabled: false,
			links,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			DashboardWidgetPopularKeywordsTable.renderLayout(
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			)
		);
	}
}

export default withData(
	DashboardWidgetPopularKeywordsTable,
	[
		{
			type: TYPE_MODULES,
			identifier: 'search-console',
			datapoint: 'searchanalytics',
			data: {
				dimensions: 'query',
				limit: 10,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Dashboard' ],
		},
	],
	DashboardWidgetPopularKeywordsTable.renderLayout(
		<PreviewTable padding />
	),
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZeroSearchConsole
);

