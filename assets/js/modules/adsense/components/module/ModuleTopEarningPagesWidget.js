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
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { numFmt } from '../../../../util';
import ReportTable from '../../../../components/ReportTable';
import Link from '../../../../components/Link';
import PreviewTable from '../../../../components/PreviewTable';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
// import AdSenseLinkCTA from '../../../analytics/components/common/AdSenseLinkCTA';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { isZeroReport } from '../../../analytics/util/is-zero-report';
import { isRestrictedMetricsError } from '../../../analytics/util/error';
import { generateDateRangeArgs } from '../../../analytics/util/report-date-range-args';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';
import ModuleHeader from '../common/ModuleHeader';
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
	const {
	//	isAdSenseLinked,
		data,
		isLoading,
		error,
		analyticsMainURL,
		currentDayCount,
	} = useSelect( ( select ) => {
		const analyticsStore = select( MODULES_ANALYTICS );
		const userStore = select( CORE_USER );

		const dateRange = userStore.getDateRange();
		const { startDate, endDate } = userStore.getDateRangeDates( {
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

		return {
			isAdSenseLinked: analyticsStore.getAdsenseLinked(),
			// data: analyticsStore.getReport( reportArgs ),
			data: fixture.data,
			error: analyticsStore.getErrorForSelector( 'getReport', [ reportArgs ] ),
			// isLoading: ! analyticsStore.hasFinishedResolution( 'getReport', [ reportArgs ] ),
			isLoading: false,
			analyticsMainURL: analyticsStore.getServiceReportURL(
				'content-publisher-overview',
				generateDateRangeArgs( { startDate, endDate } )
			),
			currentDayCount: getCurrentDateRangeDayCount( dateRange ),
		};
	} );

	// Do not return zero data callout here since it will already be
	// present on the page from other sources.
	// if ( isDataZeroForReporting( data ) ) {
	// 	return null;
	// }

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

	return (
		<Widget
			noPadding
			Header={ () => (
				<ModuleHeader
					title={
						sprintf(
							/* translators: %s: number of days */
							_n( 'Performance by page over the last %s day', 'Performance by page over the last %s days', currentDayCount, 'google-site-kit', ),
							currentDayCount,
						)
					}
					ctaLink={ analyticsMainURL }
					ctaLabel="See full stats on Analytics"
				/>
			) }
		>
			<TableOverflowContainer>
				<ReportTable
					rows={ data[ 0 ].data.rows }
					columns={ tableColumns }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}

const tableColumns = [
	{
		title: __( 'Page Title', 'google-site-kit' ),
		description: __( 'Page Title', 'google-site-kit' ),
		primary: true,
		Component: ( { row } ) => {
			const [ title, url ] = row.dimensions;
			const serviceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( 'content-pages', {
				'explorer-table.plotKeys': '[]',
				'_r.drilldown': `analytics.pagePath:${ url }`,
			} ) );
			return (
				<Link
					href={ serviceURL }
					external
					inherit
				>
					{ title }
				</Link>
			);
		},
	},
	{
		title: __( 'Earnings', 'google-site-kit' ),
		description: __( 'Earnings', 'google-site-kit' ),
		field: 'metrics.0.values.0',
		Component: ( { fieldValue } ) => numFmt(
			fieldValue,
			{
				style: 'decimal',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}
		),
	},
	{
		title: __( 'Page RPM', 'google-site-kit' ),
		description: __( 'Page RPM', 'google-site-kit' ),
		field: 'metrics.0.values.1',
		Component: ( { fieldValue } ) => numFmt(
			fieldValue,
			{
				style: 'decimal',
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}
		),
	},
	{
		title: __( 'Impressions', 'google-site-kit' ),
		description: __( 'Impressions', 'google-site-kit' ),
		field: 'metrics.0.values.2',
		Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
	},
];

ModuleTopEarningPagesWidget.propTypes = {
	Widget: PropTypes.func.isRequired,
	WidgetReportZero: PropTypes.func.isRequired,
	WidgetReportError: PropTypes.func.isRequired,
};

export default ModuleTopEarningPagesWidget;
