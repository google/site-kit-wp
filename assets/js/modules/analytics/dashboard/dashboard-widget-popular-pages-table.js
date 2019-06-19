/**
 * AnalyticsDashboardWidgetPopularPagesTable component.
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

import withData from 'GoogleComponents/higherorder/withdata';
import { getTimeInSeconds, numberFormat } from 'GoogleUtil';
import { getDataTableFromData, TableOverflowContainer } from 'GoogleComponents/data-table';
import PreviewTable from 'GoogleComponents/preview-table';
import Layout from 'GoogleComponents/layout/layout';
import { isDataZeroForReporting } from '../util';

const { __ } = wp.i18n;
const { map } = lodash;
const { Component } = wp.element;

class AnalyticsDashboardWidgetPopularPagesTable extends Component {
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
					footerCtaLabel={ __( 'Analytics', 'google-site-kit' ) }
					footerCtaLink={ googlesitekit.modules.analytics.homepage }
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
				title: __( 'Most popular content', 'google-site-kit' ),
			},
			{
				title: __( 'Views', 'google-site-kit' ),
			}
		];

		let links = [];
		const dataMapped = map( data[0].data.rows, ( row, i ) => {
			const url = row.dimensions[0];
			const title = row.dimensions[1];
			links[ i ] = url;
			return [
				title,
				numberFormat( row.metrics[0].values[0] ),
			];
		} );

		const options = {
			hideHeader: false,
			chartsEnabled: false,
			links,
			showUrls: true,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			AnalyticsDashboardWidgetPopularPagesTable.renderLayout(
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			)
		);
	}
}

export default withData(
	AnalyticsDashboardWidgetPopularPagesTable,
	[
		{
			dataObject: 'modules',
			identifier: 'analytics',
			datapoint: 'top-pages',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ]
		}
	],
	AnalyticsDashboardWidgetPopularPagesTable.renderLayout(
		<PreviewTable padding />
	),
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZeroForReporting
);
