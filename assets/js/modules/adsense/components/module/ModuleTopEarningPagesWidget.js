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
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import AdSenseLinkCTA from '../../../analytics/components/common/AdSenseLinkCTA';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { isZeroReport } from '../../../analytics/util/is-zero-report';
import { isRestrictedMetricsError } from '../../../analytics/util/error';
const { useSelect } = Data;

const fixture = {
	data: [
		{
			nextPageToken: '10',
			columnHeader: {
				dimensions: [
					'ga:pageTitle',
					'ga:pagePath',
				],
				metricHeader: {
					metricHeaderEntries: [
						{
							name: 'Earnings',
							type: 'CURRENCY',
						},
						{
							name: 'Page RPM',
							type: 'CURRENCY',
						},
						{
							name: 'Impressions',
							type: 'INTEGER',
						},
					],
				},
			},
			data: {
				dataLastRefreshed: null,
				isDataGolden: null,
				rowCount: 316,
				samplesReadCounts: null,
				samplingSpaceSizes: null,
				rows: [
					{
						dimensions: [
							'Site Kit Top Earning Page 1',
							'/',
						],
						metrics: [
							{
								values: [
									'0.76352',
									'0.6059682539682539',
									'499',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 2',
							'/site-kit-top-earning-page-2/',
						],
						metrics: [
							{
								values: [
									'0.371714',
									'10.32538888888889',
									'38',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 3',
							'/site-kit-top-earning-page-3/',
						],
						metrics: [
							{
								values: [
									'0.286556',
									'0.8790061349693251',
									'825',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 4',
							'/site-kit-top-earning-page-4/',
						],
						metrics: [
							{
								values: [
									'0.212868',
									'5.60178947368421',
									'68',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 5',
							'/site-kit-top-earning-page-5/',
						],
						metrics: [
							{
								values: [
									'0.152164',
									'15.2164',
									'22',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 6',
							'/site-kit-top-earning-page-6/',
						],
						metrics: [
							{
								values: [
									'0.036977',
									'0.33015178571428566',
									'144',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 7',
							'/site-kit-top-earning-page-7/',
						],
						metrics: [
							{
								values: [
									'0.029555',
									'0.29555',
									'206',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 8',
							'/site-kit-top-earning-page-8/',
						],
						metrics: [
							{
								values: [
									'0.028485',
									'1.0173214285714285',
									'35',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 9',
							'/site-kit-top-earning-page-9/',
						],
						metrics: [
							{
								values: [
									'0.024269',
									'0.3677121212121212',
									'81',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 10',
							'/site-kit-top-earning-page-10/',
						],
						metrics: [
							{
								values: [
									'0.019556',
									'1.777818181818182',
									'13',
								],
							},
						],
					},
				],
				totals: [
					{
						values: [
							'2.150211',
							'0.6847805732484076',
							'4304',
						],
					},
				],
				minimums: [
					{
						values: [
							'0.0',
							'0.0',
							'1',
						],
					},
				],
				maximums: [
					{
						values: [
							'0.76352',
							'15.2164',
							'825',
						],
					},
				],
			},
		},
	],
};

function ModuleTopEarningPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	// Do not return zero data callout here since it will already be
	// present on the page from other sources.
	// if ( isDataZeroForReporting( data ) ) {
	// 	return null;
	// }

	const {
		isAdSenseLinked,
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
			isAdSenseLinked: select( MODULES_ANALYTICS ).getAdsenseLinked(),
			// data: select( MODULES_ANALYTICS ).getReport( reportArgs ),
			data: fixture.data,
			error: select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ reportArgs ] ),
			// isLoading: ! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ reportArgs ] ),
			isLoading: false,
			// serviceURL: select( STORE_NAME ).getServiceReportURL( 'content-pages', {
			// 	'explorer-table.plotKeys': '[]',
			// 	'_r.drilldown': `analytics.pagePath:${ href }`,
			// } ),
		};
	} );

	// A restricted metrics error will cause this value to change in the resolver
	// so this check should happen before an error, which is only relevant if they are linked.
	// if ( ! isAdSenseLinked ) {
	// 	return <AdSenseLinkCTA />;
	// }

	if ( error && ! isRestrictedMetricsError( error ) ) {
		return <WidgetReportError error={ error } moduleSlug="adsense" />;
	}

	if ( isLoading ) {
		return <PreviewTable padding />;
	}

	if ( isZeroReport( data ) ) {
		return <WidgetReportZero module="adsense" />;
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
		PrimaryLink: () => <Link href="www.google.com" external />,
	};

	const dataTable = getDataTableFromData( dataMapped, headers, options );

	return (
		<TableOverflowContainer>
			{ dataTable }
		</TableOverflowContainer>
	);
}

ModuleTopEarningPagesWidget.propTypes = {
	// Widget: PropTypes.element.isRequired,
	// WidgetReportZero: PropTypes.element.isRequired,
	// WidgetReportError: PropTypes.element.isRequired,
};

export default ModuleTopEarningPagesWidget;
