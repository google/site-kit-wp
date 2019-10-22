/**
 * AnalyticsAdSenseDashboardWidgetTopPagesTable component.
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
import Layout from 'GoogleComponents/layout/layout';
import PreviewTable from 'GoogleComponents/preview-table';

/**
 * Internal dependencies
 */
import { analyticsAdsenseReportDataDefaults } from '../util';

const { __ } = wp.i18n;
const { map } = lodash;
const { Component } = wp.element;

class AnalyticsAdSenseDashboardWidgetTopPagesTable extends Component {
	static renderLayout( component ) {
		const { accountURL } = googlesitekit.modules.adsense;
		return (
			<Layout
				header
				title={ __( 'Performance over previous 28 days', 'google-site-kit' ) }
				headerCtaLabel={ __( 'Advanced Settings', 'google-site-kit' ) }
				headerCtaLink={ accountURL }
			>
				{ component }
			</Layout>
		);
	}

	render() {
		const { data } = this.props;

		if ( ! data || ! data.length ) {
			return null;
		}

		const headers = [
			{
				title: __( 'Page Title', 'google-site-kit' ),
				tooltip: __( 'Page Title', 'google-site-kit' ),
			},
			{
				title: __( 'Earnings', 'google-site-kit' ),
				tooltip: __( 'Earnings', 'google-site-kit' ),
			},
			{
				title: __( 'Page RPM', 'google-site-kit' ),
				tooltip: __( 'Page RPM', 'google-site-kit' ),
			},
			{
				title: __( 'Impressions', 'google-site-kit' ),
				tooltip: __( 'Impressions', 'google-site-kit' ),
			},
		];

		const dataMapped = map( data[ 0 ].data.rows, ( row ) => {
			/**
			 * dimensions[0] = ga:pageTitle
			 * dimensions[1] = ga:pagePath
			 *
			 * metrics[0] = ga:adsenseECPM
			 * metrics[1] = ga:adsensePageImpressions
			 * metrics[2] = ga:adsenseRevenue
			 */
			return [
				row.dimensions[ 0 ],
				Number( row.metrics[ 0 ].values[ 0 ] ).toFixed( 2 ),
				Number( row.metrics[ 0 ].values[ 1 ] ).toFixed( 2 ),
				numberFormat( row.metrics[ 0 ].values[ 2 ] ),
			];
		} );

		const {
			accountID,
			internalWebPropertyID,
			profileId,
		} = googlesitekit.modules.analytics.settings;

		// Construct a deep link.
		const adsenseDeepLink = `https://analytics.google.com/analytics/web/?pli=1#/report/content-pages/a${ accountID }w${ internalWebPropertyID }p${ profileId }/explorer-table.plotKeys=%5B%5D&_r.drilldown=analytics.pagePath:~2F`;

		const linksMapped = map( data[ 0 ].data.rows, ( row ) => {
			const pagePath = row.dimensions[ 1 ].replace( /\//g, '~2F' );
			return adsenseDeepLink + pagePath;
		} );

		const options = {
			hideHeader: false,
			chartsEnabled: false,
			links: linksMapped,
		};

		const dataTable = getDataTableFromData( dataMapped, headers, options );

		return (
			AnalyticsAdSenseDashboardWidgetTopPagesTable.renderLayout(
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			)
		);
	}
}

// @todo: need to have test account that connected analytics to adsense but has zero data.
const isDataZero = () => {
	return false;
};

/**
 * Check error data response, and handle the INVALID_ARGUMENT specifically.
 *
 * @param {Object} data
 * @return {*}
 */
const getDataError = ( data ) => {
	if ( ! data || ! data.error ) {
		return false;
	}

	// We don't want to show error as AdsenseDashboardOutro will be rendered for this case.
	if ( 400 === data.error.code && 'INVALID_ARGUMENT' === data.error.status && googlesitekit.modules.analytics.active ) {
		return null;
	}

	if ( data.error.message ) {
		return data.error.message;
	}

	if ( data.error.errors && data.error.errors[ 0 ] && data.error.errors[ 0 ].message ) {
		return data.error.errors[ 0 ].message;
	}

	return __( 'Unidentified error', 'google-site-kit' );
};

export default withData(
	AnalyticsAdSenseDashboardWidgetTopPagesTable,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: analyticsAdsenseReportDataDefaults,
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Single',
		},
	],
	AnalyticsAdSenseDashboardWidgetTopPagesTable.renderLayout(
		<PreviewTable padding />
	),
	{
		inGrid: true,
		fullWidth: true,
		createGrid: true,
	},
	isDataZero,
	getDataError
);
