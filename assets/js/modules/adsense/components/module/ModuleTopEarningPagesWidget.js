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
import AdSenseLinkCTA from '../../../analytics/components/common/AdSenseLinkCTA';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { isZeroReport } from '../../../analytics/util/is-zero-report';
import { isRestrictedMetricsError } from '../../../analytics/util/error';
import { generateDateRangeArgs } from '../../../analytics/util/report-date-range-args';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';
import ModuleHeader from '../common/ModuleHeader';
const { useSelect } = Data;

function ModuleTopEarningPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const {
		isAdSenseLinked,
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
			data: analyticsStore.getReport( reportArgs ),
			error: analyticsStore.getErrorForSelector( 'getReport', [ reportArgs ] ),
			isLoading: ! analyticsStore.hasFinishedResolution( 'getReport', [ reportArgs ] ),
			analyticsMainURL: analyticsStore.getServiceReportURL(
				'content-publisher-overview',
				generateDateRangeArgs( { startDate, endDate } )
			),
			currentDayCount: getCurrentDateRangeDayCount( dateRange ),
		};
	} );

	// A restricted metrics error will cause this value to change in the resolver
	// so this check should happen before an error, which is only relevant if they are linked.
	if ( ! isAdSenseLinked ) {
		return <AdSenseLinkCTA />;
	}

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
					ctaLabel="See full stats in Analytics"
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
