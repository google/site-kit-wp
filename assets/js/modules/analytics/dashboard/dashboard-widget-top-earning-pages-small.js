/**
 * AdSenseDashboardWidgetTopPagesTableSmall component.
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
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
import { getTimeInSeconds } from 'GoogleUtil';
import { getDataTableFromData, TableOverflowContainer } from 'GoogleComponents/data-table';
import PreviewTable from 'GoogleComponents/preview-table';
import Layout from 'GoogleComponents/layout/layout';
import CTA from 'GoogleComponents/notifications/cta';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { analyticsAdsenseReportDataDefaults } from '../util';

class AdSenseDashboardWidgetTopPagesTableSmall extends Component {
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
					footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					footerCtaLink="http://analytics.google.com"
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
		const dataMapped = map( data[ 0 ].data.rows, ( row, i ) => {
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
			AdSenseDashboardWidgetTopPagesTableSmall.renderLayout(
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			)
		);
	}
}

const isDataZero = () => {
	return false;
};

/**
 * Check error data response.
 *
 * @param {Object} data Response data.
 *
 * @return {HTMLElement | null} Returns HTML element markup with error message if it exists.
 */
const getDataError = ( data ) => {
	if ( data && data.error_data ) {
		const errors = Object.values( data.error_data );

		// Specifically looking for string "badRequest"
		if ( errors[ 0 ] && 'badRequest' === errors[ 0 ].reason ) {
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
						<CTA
							title={ __( 'Restricted metric(s)', 'google-site-kit' ) }
							description={ __( 'You need to link Analytics and AdSense to get report for your top earning pages. Learn more: https://support.google.com/adsense/answer/6084409 ', 'google-site-kit' ) }
						/>
					</Layout>
				</div>
			);
		}
	}

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
	AdSenseDashboardWidgetTopPagesTableSmall,
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
	AdSenseDashboardWidgetTopPagesTableSmall.renderLayout(
		<PreviewTable rows={ 5 } padding />
	),
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZero,
	getDataError,
);
