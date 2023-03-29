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
import {
	MODULES_ANALYTICS,
	DATE_RANGE_OFFSET,
} from '../../../analytics/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '../../datastore/constants';
import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import ReportTable from '../../../../components/ReportTable';
import Link from '../../../../components/Link';
import AdBlockerWarning from '../common/AdBlockerWarning';
import UACutoffWarning from '../../../analytics/components/common/UACutoffWarning';
import { generateDateRangeArgs } from '../../../analytics/util/report-date-range-args';
import {
	ZeroDataMessage,
	AdSenseLinkCTA,
} from '../../../analytics/components/common';
import { numFmt } from '../../../../util';
import { getCurrencyFormat } from '../../util/currency';
import useViewOnly from '../../../../hooks/useViewOnly';
const { useSelect, useInViewSelect } = Data;

function DashboardTopEarningPagesWidget( props ) {
	const { Widget, WidgetReportError, WidgetNull } = props;

	const viewOnlyDashboard = useViewOnly();

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const args = {
		startDate,
		endDate,
		dimensions: [ 'ga:pageTitle', 'ga:pagePath' ],
		metrics: [
			{ expression: 'ga:adsenseRevenue', alias: 'Earnings' },
			{ expression: 'ga:adsenseECPM', alias: 'Page RPM' },
			{
				expression: 'ga:adsensePageImpressions',
				alias: 'Impressions',
			},
		],
		orderby: {
			fieldName: 'ga:adsenseRevenue',
			sortOrder: 'DESCENDING',
		},
		limit: 5,
	};

	const data = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( args )
	);

	const adsenseData = useInViewSelect( ( select ) =>
		select( MODULES_ADSENSE ).getReport( {
			startDate,
			endDate,
			metrics: 'ESTIMATED_EARNINGS',
		} )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
				args,
			] )
	);

	const isAdSenseLinked = useSelect( ( select ) => {
		if ( viewOnlyDashboard && loading ) {
			return undefined;
		}
		return select( MODULES_ANALYTICS ).getAdsenseLinked();
	} );

	const isAdblockerActive = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isAdBlockerActive()
	);

	const currencyFormat = getCurrencyFormat( adsenseData );

	const analyticsMainURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ANALYTICS ).getServiceReportURL(
			'content-publisher-overview',
			generateDateRangeArgs( { startDate, endDate } )
		);
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

	if ( loading || isGatheringData === undefined ) {
		return (
			<Widget noPadding Footer={ Footer }>
				<PreviewTable rows={ 5 } padding />
			</Widget>
		);
	}

	if ( ! isAdSenseLinked && viewOnlyDashboard ) {
		return <WidgetNull />;
	}

	// A restricted metrics error will cause this value to change in the resolver
	// so this check should happen before an error, which is only relevant if they are linked.
	if ( ! isAdSenseLinked && ! viewOnlyDashboard ) {
		return (
			<Widget Footer={ Footer }>
				<AdSenseLinkCTA />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Footer={ Footer }>
				<WidgetReportError moduleSlug="analytics" error={ error } />
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
						hideExternalIndicator
					/>
				);
			},
		},
		{
			title: __( 'Earnings', 'google-site-kit' ),
			tooltip: __( 'Earnings', 'google-site-kit' ),
			field: 'metrics.0.values.0',
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( fieldValue, currencyFormat ) }</span>
			),
		},
	];

	return (
		<Widget noPadding Footer={ Footer }>
			<UACutoffWarning />
			<TableOverflowContainer>
				<ReportTable
					rows={ data?.[ 0 ]?.data?.rows || [] }
					columns={ tableColumns }
					zeroState={ ZeroDataMessage }
					gatheringData={ isGatheringData }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}

export default compose(
	whenActive( { moduleName: 'adsense' } ),
	whenActive( { moduleName: 'analytics' } )
)( DashboardTopEarningPagesWidget );
