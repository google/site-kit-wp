/**
 * DashboardPopularKeywordsWidget component.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DATE_RANGE_OFFSET, MODULES_SEARCH_CONSOLE, STORE_NAME } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import { isZeroReport } from '../../util';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import { generateDateRangeArgs } from '../../util/report-date-range-args';
import ReportTable from '../../../../components/ReportTable';
import Link from '../../../../components/Link';
import { numFmt } from '../../../../util';
const { useSelect } = Data;

function DashboardPopularKeywordsWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ) );

	const reportArgs = {
		...dateRangeDates,
		dimensions: 'query',
		limit: 10,
	};

	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	if ( url ) {
		reportArgs.url = url;
	}

	const data = useSelect( ( select ) => select( STORE_NAME ).getReport( reportArgs ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ reportArgs ] ) );
	const loading = useSelect( ( select ) => ! select( STORE_NAME ).hasFinishedResolution( 'getReport', [ reportArgs ] ) );
	const baseServiceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( {
		...generateDateRangeArgs( dateRangeDates ),
		page: url ? `!${ url }` : undefined,
	} ) );

	const Footer = () => (
		<SourceLink
			className="googlesitekit-data-block__source"
			name={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
			href={ baseServiceURL }
			external
		/>
	);

	if ( loading ) {
		return (
			<Widget noPadding Footer={ Footer } >
				<PreviewTable padding />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Footer={ Footer } >
				<WidgetReportError moduleSlug="search-console" error={ error } />
			</Widget>
		);
	}

	if ( isZeroReport( data ) ) {
		return (
			<Widget Footer={ Footer } >
				<WidgetReportZero moduleSlug="search-console" />
			</Widget>
		);
	}

	const tableColumns = [
		{
			title: url ? __( 'Top search queries for your page', 'google-site-kit' ) : __( 'Top search queries for your site', 'google-site-kit' ),
			description: __( 'Most searched for keywords related to your content', 'google-site-kit' ),
			primary: true,
			field: 'keys.0',
			Component: ( { fieldValue } ) => {
				const searchAnalyticsURL = useSelect( ( select ) => {
					const dates = select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } );
					const entityURL = select( CORE_SITE ).getCurrentEntityURL();
					return select( MODULES_SEARCH_CONSOLE ).getServiceReportURL( {
						...generateDateRangeArgs( dates ),
						query: `!${ fieldValue }`,
						page: entityURL ? `!${ entityURL }` : undefined,
					} );
				} );

				return (
					<Link
						href={ searchAnalyticsURL }
						external
						inherit
					>
						{ fieldValue }
					</Link>
				);
			},
		},
		{
			title: __( 'Clicks', 'google-site-kit' ),
			description: __( 'Number of times users clicked on your content in search results', 'google-site-kit' ),
			Component: ( { row } ) => (
				<span>
					{ numFmt( row.clicks, { style: 'decimal' } ) }
				</span>
			),
		},
		{
			title: __( 'Impressions', 'google-site-kit' ),
			description: __( 'Counted each time your content appears in search results', 'google-site-kit' ),
			Component: ( { row } ) => (
				<span>
					{ numFmt( row.impressions, { style: 'decimal' } ) }
				</span>
			),
		},
	];

	return (
		<Widget noPadding Footer={ Footer }>
			<TableOverflowContainer>
				<ReportTable
					rows={ data }
					columns={ tableColumns }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}

export default whenActive( { moduleName: 'search-console' } )( DashboardPopularKeywordsWidget );
