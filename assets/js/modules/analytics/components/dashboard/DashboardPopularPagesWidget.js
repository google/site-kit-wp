/**
 * DashboardPopularPagesWidget component.
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
 * External dependencies
 */
import cloneDeep from 'lodash/cloneDeep';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS,
} from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import { isZeroReport } from '../../util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
import ReportTable from '../../../../components/ReportTable';
import DetailsPermaLinks from '../../../../components/DetailsPermaLinks';
import { numFmt } from '../../../../util';
import { ZeroDataMessage } from '../common';
const { useSelect, useInViewSelect } = Data;

function DashboardPopularPagesWidget( props ) {
	const { Widget, WidgetReportZero, WidgetReportError } = props;

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);

	const { startDate, endDate, compareStartDate, compareEndDate } = useSelect(
		( select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} )
	);

	const args = {
		startDate,
		endDate,
		dimensions: [ 'ga:pagePath' ],
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
		],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 10,
	};

	const analyticsMainURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getServiceReportURL(
			'content-pages',
			generateDateRangeArgs( {
				startDate,
				endDate,
				compareStartDate,
				compareEndDate,
			} )
		)
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] )
	);

	const data = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( args )
	);

	const titles = useInViewSelect( ( select ) =>
		! error
			? select( MODULES_ANALYTICS ).getPageTitles( data, args )
			: undefined
	);

	const loading = useSelect( ( select ) => {
		const hasLoadedPageTitles = undefined !== error || undefined !== titles;
		const hasLoaded =
			hasLoadedPageTitles &&
			select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
				args,
			] );

		return ! hasLoaded;
	} );

	const Footer = () => (
		<SourceLink
			className="googlesitekit-data-block__source"
			name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			href={ analyticsMainURL }
			external
		/>
	);

	if ( loading || isGatheringData === undefined ) {
		return (
			<Widget noPadding Footer={ Footer }>
				<PreviewTable padding />
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

	if ( isGatheringData && isZeroReport( data ) ) {
		return (
			<Widget Footer={ Footer }>
				<WidgetReportZero moduleSlug="analytics" />
			</Widget>
		);
	}

	const rows = data?.[ 0 ]?.data?.rows?.length
		? cloneDeep( data[ 0 ].data.rows )
		: [];

	// Combine the titles from the pageTitles with the rows from the metrics report.
	rows.forEach( ( row ) => {
		const url = row.dimensions[ 0 ];
		row.dimensions.unshift( titles[ url ] ); // We always have an entry for titles[url].
	} );

	return (
		<Widget noPadding Footer={ Footer }>
			<TableOverflowContainer>
				<ReportTable
					rows={ rows }
					columns={ tableColumns }
					zeroState={ ZeroDataMessage }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}

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
		Component: ( { fieldValue } ) => (
			<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
		),
	},
];

export default whenActive( { moduleName: 'analytics' } )(
	DashboardPopularPagesWidget
);
