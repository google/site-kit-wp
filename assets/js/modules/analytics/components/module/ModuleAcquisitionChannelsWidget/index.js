/**
 * ModuleAcquisitionChannelsWidget component.
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
import { __, _n, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
// import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../../components/PreviewTable';
import SourceLink from '../../../../../components/SourceLink';
import { isZeroReport, trafficSourcesReportDataDefaults } from '../../../util';
import TableOverflowContainer from '../../../../../components/TableOverflowContainer';
// import { generateDateRangeArgs } from '../../util/report-date-range-args';
import ReportTable from '../../../../../components/ReportTable';
// import DetailsPermaLinks from '../../../../components/DetailsPermaLinks';
// import { numFmt } from '../../../../util';
import ModuleHeader from '../../../../../components/module/ModuleHeader';
import { getCurrentDateRangeDayCount } from '../../../../../util/date-range';
// import Link from '../../../../components/Link';
// import { getCurrentDateRangeDayCount } from '../../../../util/date-range';

const { useSelect } = Data;

export default function ModuleAcquisitionChannelsWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const url = global._googlesitekitLegacyData.permaLink;
	const {
		hasFinishedResolution,
		dateRange,
		report,
		error,
	} = useSelect( ( select ) => {
		const reportDateRange = select( CORE_USER ).getDateRange();
		const reportArgs = {
			...trafficSourcesReportDataDefaults,
			url,
			dateRange: reportDateRange,
		};

		return {
			dateRange: reportDateRange,
			report: select( STORE_NAME ).getReport( reportArgs ),
			hasFinishedResolution: select( STORE_NAME ).hasFinishedResolution( 'getReport', [ reportArgs ] ),
			error: select( STORE_NAME ).getErrorForSelector( 'getReport', [ reportArgs ] ),
		};
	} );

	if ( ! hasFinishedResolution ) {
		return <PreviewTable rows={ 4 } rowHeight={ 50 } />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	global.console.log( 'here-1' );
	if ( false && isZeroReport( report ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	const data = report;

	const currentDayCount = getCurrentDateRangeDayCount( dateRange );

	const tableColumns = [
		{
			title: __( 'Channel', 'google-site-kit' ),
			tooltip: __( 'Channel refers to where your traffic originated from', 'google-site-kit' ),
			Component: ( { row } ) => {
				const foo = JSON.stringify( row );
				return (
					<p>{ foo }</p>
				);
			},
		},
		{
			title: __( 'Users', 'google-site-kit' ),
			tooltip: __( 'Number of users that originated from that traffic', 'google-site-kit' ),
			Component: ( { row } ) => {
				const foo = JSON.stringify( row );
				return (
					<p>{ foo }</p>
				);
			},
		},
		{
			title: __( 'New Users', 'google-site-kit' ),
			tooltip: sprintf(
				/* translators: %s: number of days */
				_n( 'Number of new users to visit your page over last %s day', 'Number of new users to visit your page over last %s days', currentDayCount, 'google-site-kit', ),
				currentDayCount,
			),
			Component: ( { row } ) => {
				const foo = JSON.stringify( row );
				return (
					<p>{ foo }</p>
				);
			},
		},
		{
			title: __( 'Sessions', 'google-site-kit' ),
			tooltip: sprintf(
				/* translators: %s: number of days */
				_n( 'Number of sessions users had on your website over last %s day', 'Number of sessions users had on your website over last %s days', currentDayCount, 'google-site-kit', ),
				currentDayCount,
			),
			Component: ( { row } ) => {
				const foo = JSON.stringify( row );
				return (
					<p>{ foo }</p>
				);
			},
		},
		{
			title: __( 'Percentage', 'google-site-kit' ),
			tooltip: __( 'Percentage of sessions', 'google-site-kit' ),
			Component: ( { row } ) => {
				const foo = JSON.stringify( row );
				return (
					<p>{ foo }</p>
				);
			},
		},
	];

	return (
		<Widget
			noPadding
			Header={ () => (
				<ModuleHeader
					title={
						'foobar123'
					}
					ctaLink={ url }
					ctaLabel="See full stats in Analytics"
				/>
			) }
			Footer={ () => (
				<SourceLink
					className="googlesitekit-data-block__source"
					name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					href={ url }
					external
				/>
			) }
		>
			<TableOverflowContainer>
				<ReportTable
					rows={ data[ 0 ].data.totals[ 0 ].values }
					columns={ tableColumns }
				/>
			</TableOverflowContainer>
		</Widget>
	);
	/*
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
	*/
}

/*
const tableColumns = [
	{
		title: __( 'Most popular content', 'google-site-kit' ),
		primary: true,
		Component: ( { row } ) => {
			const [ title, path ] = row.dimensions;
			return <DetailsPermaLinks title={ title } path={ path } />;
		},
	},
	{
		title: __( 'Views', 'google-site-kit' ),
		field: 'metrics.0.values.0',
		Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
	},
];
*/

// export default whenActive( { moduleName: 'analytics' } )( DashboardPopularPagesWidget );
