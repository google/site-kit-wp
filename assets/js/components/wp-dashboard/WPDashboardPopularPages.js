/**
 * WPDashboardPopularPages component.
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
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS, DATE_RANGE_OFFSET } from '../../modules/analytics/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import PreviewBlock from '../PreviewBlock';
import ReportError from '../ReportError';
import { numFmt } from '../../util';
import TableOverflowContainer from '../../components/TableOverflowContainer';
import { getDataTableFromData } from '../../components/data-table';
const { useSelect } = Data;

const WPDashboardPopularPages = () => {
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	const reportArgs = {
		...dateRangeDates,
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
		],
		dimensions: [
			'ga:pageTitle',
			'ga:pagePath',
		],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 5,
	};

	const data = useSelect( ( select ) => select( MODULES_ANALYTICS ).getReport( reportArgs ) );
	const error = useSelect( ( select ) => select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ reportArgs ] ) );
	const loading = useSelect( ( select ) => ! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [ reportArgs ] ) );

	if ( loading ) {
		return <PreviewBlock width="48%" height="92px" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	const headers = [
		{
			title: __( 'Title', 'google-site-kit' ),
			tooltip: __( 'Page Title', 'google-site-kit' ),
			primary: true,
		},
		{
			title: __( 'Pageviews', 'google-site-kit' ),
			tooltip: __( 'Pageviews', 'google-site-kit' ),
		},
	];
	const links = [];
	const dataMapped = data[ 0 ].data.rows.map( ( row, i ) => {
		const [ title, url ] = row.dimensions;
		links[ i ] = url;

		return [
			title,
			numFmt( row.metrics[ 0 ].values[ 0 ], { style: 'decimal' } ),
		];
	} );
	const options = {
		hideHeader: false,
		chartsEnabled: false,
		links,
		hideColumns: {
			mobile: [ 2, 3 ],
		},
	};
	const dataTable = getDataTableFromData( dataMapped, headers, options );

	return (
		<div className="googlesitekit-search-console-widget">
			<h2 className="googlesitekit-search-console-widget__title">
				{ __( 'Top content over the last 28 days', 'google-site-kit' ) }
			</h2>
			<TableOverflowContainer>
				{ dataTable }
			</TableOverflowContainer>
		</div>
	);
};

export default WPDashboardPopularPages;

