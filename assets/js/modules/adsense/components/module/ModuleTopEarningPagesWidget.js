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
import { numFmt } from '../../../../util';
import { getDataTableFromData } from '../../../../components/data-table';
import Link from '../../../../components/Link';
import PreviewTable from '../../../../components/PreviewTable';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import isZeroReport from '../../../search-console/util/is-zero-report';
const { useSelect } = Data;

function ModuleTopEarningPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	// Do not return zero data callout here since it will already be
	// present on the page from other sources.
	// if ( isDataZeroForReporting( data ) ) {
	// 	return null;
	// }

	const {
		data,
		isLoading,
		error,
		serviceURL,
	} = useSelect( ( select ) => {
		const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const reportArgs = {
			startDate,
			endDate,
			dimensions: [ 'ga:pageTitle', 'ga:pagePath' ],
			metrics: [
				{ expression: 'ga:adsenseRevenue', alias: 'Earnings' },
				{ expression: 'ga:adsenseECPM', alias: 'Page RPM' },
				{ expression: 'ga:adsensePageImpressions', alias: 'Impressions' },
			],
			orderby: {
				fieldName: 'ga:adsenseRevenue',
				sortOrder: 'DESCENDING',
			},
			limit: 10,
		};

		const href = '/';

		return {
			data: select( MODULES_ANALYTICS ).getReport( reportArgs ),
			error: select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ reportArgs ] ),
			isLoading: select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ reportArgs ] ),
			serviceURL: select( STORE_NAME ).getServiceReportURL( 'content-pages', {
				'explorer-table.plotKeys': '[]',
				'_r.drilldown': `analytics.pagePath:${ href }`,
			} ),
		};
	} );

	if ( error ) {
		return <WidgetReportError error={ error } moduleSlug="adsense" />;
	}

	if ( isLoading ) {
		return <PreviewTable padding />;
	}

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
		PrimaryLink: <Link href={ serviceURL } external />,
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
	// Widget: PropTypes.element.isRequired,
	// WidgetReportZero: PropTypes.element.isRequired,
	// WidgetReportError: PropTypes.element.isRequired,
};

export default ModuleTopEarningPagesWidget;
