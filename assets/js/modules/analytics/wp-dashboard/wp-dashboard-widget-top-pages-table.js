/**
 * WPAnalyticsDashboardWidgetTopPagesTable component.
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
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getTimeInSeconds, numberFormat } from '../../../util';
import withData from '../../../components/higherorder/withdata';
import { TYPE_MODULES } from '../../../components/data';
import { getDataTableFromData, TableOverflowContainer } from '../../../components/data-table';
import PreviewTable from '../../../components/preview-table';
import { isDataZeroForReporting, getTopPagesReportDataDefaults } from '../util';

class WPAnalyticsDashboardWidgetTopPagesTable extends Component {
	render() {
		const { data } = this.props;
		const { siteURL } = global.googlesitekit.admin;

		if ( isDataZeroForReporting( data ) ) {
			return null;
		}

		const links = [];
		const dataMapped = map( data[ 0 ].data.rows, ( row, i ) => {
			const [ title, url ] = row.dimensions;
			links[ i ] = siteURL + url;

			return [
				title,
				numberFormat( row.metrics[ 0 ].values[ 0 ] ),
			];
		} );

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
		];

		const options = {
			chartsEnabled: true,
			links,
			cap: 5,
			showURLs: true,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			<div className="googlesitekit-search-console-widget">
				<h2 className="googlesitekit-search-console-widget__title">
					{ __( 'Top content over the last 28 days', 'google-site-kit' ) }
				</h2>
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			</div>
		);
	}
}

export default withData(
	WPAnalyticsDashboardWidgetTopPagesTable,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: getTopPagesReportDataDefaults(),
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'WPDashboard',
		},
	],
	<PreviewTable rows={ 6 } />
);
