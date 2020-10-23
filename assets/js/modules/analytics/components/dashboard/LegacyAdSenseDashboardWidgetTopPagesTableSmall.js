/**
 * LegacyAdSenseDashboardWidgetTopPagesTableSmall component.
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
import withData from '../../../../components/higherorder/withdata';
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData, TableOverflowContainer } from '../../../../components/data-table';
import PreviewTable from '../../../../components/preview-table';
import Layout from '../../../../components/layout/layout';
import AdSenseLinkCTA from '../common/AdSenseLinkCTA';
import { getTimeInSeconds } from '../../../../util';
import {
	analyticsAdsenseReportDataDefaults,
	isDataZeroForReporting,
} from '../../util';

class LegacyAdSenseDashboardWidgetTopPagesTableSmall extends Component {
	static renderLayout( component ) {
		return (
			<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-6-desktop
				mdc-layout-grid__cell--span-4-tablet
			">
				<Layout
					className="googlesitekit-top-earnings-pages"
					footer
					footerCTALabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					footerCTALink="http://analytics.google.com"
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
				title: __( 'Top Earning Pages', 'google-site-kit' ),
				tooltip: __( 'Top Earning Pages', 'google-site-kit' ),
				primary: true,
			},
			{
				title: __( 'Revenue', 'google-site-kit' ),
				tooltip: __( 'Revenue', 'google-site-kit' ),
			},
		];

		const links = [];
		const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
			links[ i ] = row.dimensions[ 1 ];
			return [
				row.dimensions[ 0 ],
				Number( row.metrics[ 0 ].values[ 0 ] ).toFixed( 2 ),
			];
		} );

		const options = {
			hideHeader: false,
			chartsEnabled: false,
			cap: 5,
			links,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			LegacyAdSenseDashboardWidgetTopPagesTableSmall.renderLayout(
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			)
		);
	}
}

/**
 * Checks error data response.
 *
 * @since 1.0.0
 *
 * @param {Object} data Response error data.
 * @return {(HTMLElement|null)} Returns HTML element markup with error message if it exists.
 */
const getDataError = ( data ) => {
	if ( data.code && data.message && data.data && data.data.status ) {
		// Specifically looking for string "badRequest"
		if ( 'badRequest' === data.data.reason ) {
			return (
				<div className="
						mdc-layout-grid__cell
						mdc-layout-grid__cell--span-6-desktop
						mdc-layout-grid__cell--span-4-tablet
					">
					<Layout
						className="googlesitekit-top-earnings-pages"
						fill
					>
						<AdSenseLinkCTA />
					</Layout>
				</div>
			);
		}

		return data.message;
	}

	// Legacy errors? Maybe this is never hit but better be safe than sorry.
	if ( data && data.errors ) {
		const errors = Object.values( data.errors );
		if ( errors[ 0 ] && errors[ 0 ][ 0 ] ) {
			return errors[ 0 ][ 0 ];
		}
	}

	// No error.
	return false;
};

export default withData(
	LegacyAdSenseDashboardWidgetTopPagesTableSmall,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: analyticsAdsenseReportDataDefaults,
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
		},
	],
	LegacyAdSenseDashboardWidgetTopPagesTableSmall.renderLayout(
		<PreviewTable rows={ 5 } padding />
	),
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZeroForReporting,
	getDataError,
);
