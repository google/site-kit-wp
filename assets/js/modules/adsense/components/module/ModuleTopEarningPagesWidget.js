/**
 * ModuleTopEarningPagesWidget module
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
import { getTimeInSeconds, numFmt } from '../../../../util';
import { getDataTableFromData } from '../../../../components/data-table';
import { STORE_NAME } from '../../datastore/constants';
const { useSelect } = Data;

function ModuleTopEarningPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	// Do not return zero data callout here since it will already be
	// present on the page from other sources.
	// if ( isDataZeroForReporting( data ) ) {
	// 	return null;
	// }

	const reportArgs = {

	};

	const {
		data,
		isLoading,
		error,
	} = useSelect( ( select ) => {
		const data = select( STORE_NAME ).getReport( reportArgs );
		const isLoading = select( STORE_NAME ).hasFinishedResolution();
		const error = select( STORE_NAME ).getErrorForSelector(); select( STORE_NAME ).getReport( reportArgs );
		const href = '/';
		const serviceURL = select( STORE_NAME ).getServiceReportURL( 'content-pages', {
			'explorer-table.plotKeys': '[]',
			'_r.drilldown': `analytics.pagePath:${ href }`,
		} );

		return {
			data,
			error,
			isLoading,
			serviceURL,
		};
	} );

	const { rows } = data?.[ 0 ]?.data || {};
	if ( ! Array.isArray( rows ) ) {
		return null;
	}

	const headers = [
		{
			title: __( 'Page Title', 'google-site-kit' ),
			tooltip: __( 'Page Title', 'google-site-kit' ),
			primary: true,
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

	const dataMapped = rows.map( ( row ) => {
		/**
		 * The shape of the dimensions and metrics objects:
		 *
		 * ```
		 * dimensions[0] = ga:pageTitle
		 * dimensions[1] = ga:pagePath
		 *
		 * metrics[0] = ga:adsenseECPM
		 * metrics[1] = ga:adsensePageImpressions
		 * metrics[2] = ga:adsenseRevenue
		 * ```
		 */
		return [
			row.dimensions[ 0 ],
			Number( row.metrics[ 0 ].values[ 0 ] ).toFixed( 2 ),
			Number( row.metrics[ 0 ].values[ 1 ] ).toFixed( 2 ),
			numFmt( row.metrics[ 0 ].values[ 2 ], { style: 'decimal' } ),
		];
	} );

	const options = {
		hideHeader: false,
		chartsEnabled: false,
		links: rows.map( ( row ) => row.dimensions[ 1 ] || '/' ),
		PrimaryLink: withSelect( ( select, { href = '/' } ) => {
			const serviceURL = select( STORE_NAME ).getServiceReportURL( 'content-pages', {
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
		<AnalyticsAdSenseDashboardWidgetLayout>
			<TableOverflowContainer>
				{ dataTable }
			</TableOverflowContainer>
		</AnalyticsAdSenseDashboardWidgetLayout>
	);
}

ModuleTopEarningPagesWidget.propTypes = {
	Widget: PropTypes.element.isRequired,
	WidgetReportZero: PropTypes.element.isRequired,
	WidgetReportError: PropTypes.element.isRequired,
};

export default ModuleTopEarningPagesWidget;
