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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Widgets from 'googlesitekit-widgets';
import { DATE_RANGE_OFFSET, STORE_NAME } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import { getDataTableFromData } from '../../../../components/data-table';
import { numFmt } from '../../../../util';
import { isZeroReport } from '../../util';
import ReportError from '../../../../components/ReportError';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const { useSelect } = Data;
const { Widget } = Widgets.components;

function DashboardPopularPagesWidget( { WidgetReportZero } ) {
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
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	const headers = [
		{
			title: __( 'Most popular content', 'google-site-kit' ),
			primary: true,
		},
		{
			title: __( 'Views', 'google-site-kit' ),
		},
	];

	const links = [];
	const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
		const [ title, url ] = row.dimensions;
		links[ i ] = url.startsWith( '/' ) ? url : '/' + url;

		return [
			title,
			numFmt( row.metrics[ 0 ].values[ 0 ], { style: 'decimal' } ),
		];
	} );

	const options = {
		hideHeader: false,
		chartsEnabled: false,
		links,
		showURLs: true,
		useAdminURLs: true,
	};

	const dataTable = getDataTableFromData( dataMapped, headers, options );

	return (
		<Widget
			slug="analyticsPopularPages"
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
				{ dataTable }
			</TableOverflowContainer>
		</Widget>
	);
}

export default whenActive( { moduleName: 'analytics' } )( DashboardPopularPagesWidget );
