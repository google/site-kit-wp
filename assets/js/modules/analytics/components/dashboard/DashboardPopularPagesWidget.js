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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DATE_RANGE_OFFSET, STORE_NAME } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import { numFmt } from '../../../../util';
import { isZeroReport } from '../../util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
import ReportTable from '../../../../components/ReportTable';
import Link from '../../../../components/Link';

const { useSelect } = Data;

function DashboardPopularPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const {
		data,
		error,
		loading,
		analyticsMainURL,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const { startDate, endDate, compareStartDate, compareEndDate } = select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } );
		const args = {
			startDate,
			endDate,
			dimensions: [
				'ga:pageTitle',
				'ga:pagePath',
			],
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

		return {
			analyticsMainURL: store.getServiceReportURL(
				'content-pages',
				generateDateRangeArgs( { startDate, endDate, compareStartDate, compareEndDate } ),
			),
			data: store.getReport( args ),
			error: store.getErrorForSelector( 'getReport', [ args ] ),
			loading: ! store.hasFinishedResolution( 'getReport', [ args ] ),
		};
	} );

	if ( loading ) {
		return <PreviewTable padding />;
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
		title: __( 'Most popular content', 'google-site-kit' ),
		primary: true,
		Component: ( { row } ) => {
			const [ title, pathname ] = row.dimensions;
			const siteURL = useSelect( ( select ) => select( CORE_SITE ).getReferenceSiteURL() );
			const permaLink = new URL( pathname, siteURL ).href;
			const detailsURL = useSelect( ( select ) => {
				return select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', { permaLink } );
			} );

			return (
				<Fragment>
					<Link href={ detailsURL } inherit>
						{ title }
					</Link>

					<Link
						className="googlesitekit-table__link--secondary"
						href={ permaLink }
						inherit
						external
					>
						{ pathname }
					</Link>
				</Fragment>
			);
		},
	},
	{
		title: __( 'Views', 'google-site-kit' ),
		Component: ( { row } ) => numFmt( row.metrics[ 0 ].values[ 0 ], { style: 'decimal' } ),
	},
];

export default whenActive( { moduleName: 'analytics' } )( DashboardPopularPagesWidget );
