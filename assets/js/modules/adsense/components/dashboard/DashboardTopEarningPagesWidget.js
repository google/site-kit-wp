/**
 * DashboardTopEarningPagesWidget component.
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
import { __, _x } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS, DATE_RANGE_OFFSET } from '../../../analytics/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import AdSenseLinkCTA from '../../../analytics/components/common/AdSenseLinkCTA';
import { isZeroReport } from '../../../analytics/util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import ReportTable from '../../../../components/ReportTable';
import Link from '../../../../components/Link';
import { generateDateRangeArgs } from '../../../analytics/util/report-date-range-args';
import Decimal from '../../../../components/Num/Decimal';
const { useSelect } = Data;

function DashboardTopEarningPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const {
		isAdSenseLinked,
		analyticsMainURL,
		data,
		error,
		loading,
	} = useSelect( ( select ) => {
		const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const args = {
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
			limit: 5,
		};

		return {
			isAdSenseLinked: select( MODULES_ANALYTICS ).getAdsenseLinked(),
			analyticsMainURL: select( MODULES_ANALYTICS ).getServiceReportURL( 'content-publisher-overview', generateDateRangeArgs( { startDate, endDate } ) ),
			data: select( MODULES_ANALYTICS ).getReport( args ),
			error: select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] ),
			loading: ! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ args ] ),
		};
	} );

	if ( loading ) {
		return <PreviewTable rows={ 5 } padding />;
	}

	// A restricted metrics error will cause this value to change in the resolver
	// so this check should happen before an error, which is only relevant if they are linked.
	if ( ! isAdSenseLinked ) {
		return <AdSenseLinkCTA />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	return (
		<Widget
			noPadding
			Footer={ () => (
				<SourceLink
					className="googlesitekit-data-block__source"
					name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					href={ analyticsMainURL }
					external
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
		title: __( 'Top Earning Pages', 'google-site-kit' ),
		tooltip: __( 'Top Earning Pages', 'google-site-kit' ),
		primary: true,
		Component: ( { row } ) => {
			const [ title, url ] = row.dimensions;
			return (
				<Link
					href={ url }
					children={ title }
					external
					inherit
				/>
			);
		},
	},
	{
		title: __( 'Revenue', 'google-site-kit' ),
		tooltip: __( 'Revenue', 'google-site-kit' ),
		Component: ( { row } ) => (
			<Decimal
				value={ row.metrics[ 0 ].values[ 0 ] }
				precision={ 2 }
				fixed
			/>
		),
	},
];

export default compose(
	whenActive( { moduleName: 'adsense' } ),
	whenActive( { moduleName: 'analytics' } ),
)( DashboardTopEarningPagesWidget );
