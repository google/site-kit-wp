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
import { STORE_NAME } from '../../datastore/constants';
import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import AdSenseLinkCTA from '../../../analytics/components/common/AdSenseLinkCTA';
import { isZeroReport } from '../../../analytics/util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import ReportTable from '../../../../components/ReportTable';
import Link from '../../../../components/Link';
import AdBlockerWarning from '../common/AdBlockerWarning';
import { generateDateRangeArgs } from '../../../analytics/util/report-date-range-args';
import { numFmt } from '../../../../util';
import { getCurrencyFormat } from '../../util/currency';
const { useSelect } = Data;

function DashboardTopEarningPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const {
		analyticsMainURL,
		data,
		error,
		loading,
		isAdSenseLinked,
		isAdblockerActive,
		currencyFormat,
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

		const adsenseData = select( STORE_NAME ).getReport( {
			startDate,
			endDate,
			metrics: 'ESTIMATED_EARNINGS',
		} );

		const adSenseLinked = select( MODULES_ANALYTICS ).getAdsenseLinked();

		return {
			analyticsMainURL: select( MODULES_ANALYTICS ).getServiceReportURL( 'content-publisher-overview', generateDateRangeArgs( { startDate, endDate } ) ),
			data: select( MODULES_ANALYTICS ).getReport( args ),
			error: select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] ),
			loading: ! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ args ] ),
			isAdSenseLinked: adSenseLinked,
			isAdblockerActive: select( STORE_NAME ).isAdBlockerActive(),
			currencyFormat: getCurrencyFormat( adsenseData ),
		};
	} );

	const Footer = () => (
		<SourceLink
			className="googlesitekit-data-block__source"
			name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			href={ analyticsMainURL }
			external
		/>
	);

	if ( isAdblockerActive ) {
		return (
			<Widget Footer={ Footer }>
				<AdBlockerWarning />
			</Widget>
		);
	}

	if ( loading ) {
		return (
			<Widget noPadding Footer={ Footer }>
				<PreviewTable rows={ 5 } padding />
			</Widget>
		);
	}

	// A restricted metrics error will cause this value to change in the resolver
	// so this check should happen before an error, which is only relevant if they are linked.
	if ( ! isAdSenseLinked ) {
		return (
			<Widget Footer={ Footer }>
				<AdSenseLinkCTA />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Footer={ Footer } >
				<WidgetReportError moduleSlug="analytics" error={ error } />
			</Widget>
		);
	}

	if ( isZeroReport( data ) ) {
		return (
			<Widget Footer={ Footer }>
				<WidgetReportZero moduleSlug="analytics" />
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
			title: __( 'Earnings', 'google-site-kit' ),
			tooltip: __( 'Earnings', 'google-site-kit' ),
			field: 'metrics.0.values.0',
			Component: ( { fieldValue } ) => (
				<span>
					{ numFmt( fieldValue, currencyFormat ) }
				</span>
			),
		},
	];

	return (
		<Widget noPadding Footer={ Footer }>
			<TableOverflowContainer>
				<ReportTable
					rows={ data[ 0 ].data.rows }
					columns={ tableColumns }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}

export default compose(
	whenActive( { moduleName: 'adsense' } ),
	whenActive( { moduleName: 'analytics' } ),
)( DashboardTopEarningPagesWidget );
