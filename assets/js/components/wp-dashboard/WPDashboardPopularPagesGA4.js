/**
 * WPDashboardPopularPagesGA4 component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { cloneDeep } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_ANALYTICS_4,
	DATE_RANGE_OFFSET,
} from '../../modules/analytics-4/datastore/constants';
import { ZeroDataMessage } from '../../modules/analytics/components/common';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import PreviewTable from '../PreviewTable';
import TableOverflowContainer from '../TableOverflowContainer';
import ReportTable from '../ReportTable';
import DetailsPermaLinks from '../DetailsPermaLinks';
import { numFmt } from '../../util';
import WPDashboardReportError from './WPDashboardReportError';
const { useSelect, useInViewSelect } = Data;

export default function WPDashboardPopularPagesGA4() {
	const dateRangeDates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);

	const reportArgs = {
		...dateRangeDates,
		dimensions: [ 'pagePath' ],
		metrics: [
			{
				name: 'screenPageViews',
			},
		],
		orderby: [
			{
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 5,
	};

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( reportArgs )
	);

	const titles = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPageTitles( report, reportArgs )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);

	const loading = useSelect( ( select ) => {
		const hasLoadedPageTitles = undefined !== error || undefined !== titles;
		if ( ! hasLoadedPageTitles ) {
			return true;
		}

		return ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getReport',
			[ reportArgs ]
		);
	} );

	if ( loading || isGatheringData === undefined ) {
		return <PreviewTable rows={ 6 } />;
	}

	if ( error ) {
		return (
			<WPDashboardReportError moduleSlug="analytics-4" error={ error } />
		);
	}

	// data.rows is not guaranteed to be set so we need a fallback.
	const rows = report?.rows?.length ? cloneDeep( report.rows ) : [];
	// Combine the titles from the pageTitles with the rows from the metrics report.
	rows.forEach( ( row ) => {
		const url = row.dimensionValues[ 0 ].value;
		row.dimensionValues.unshift( { value: titles[ url ] } ); // We always have an entry for titles[url].
	} );

	const tableColumns = [
		{
			title: __( 'Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			Component: ( { row } ) => {
				const [ { value: title }, { value: url } ] =
					row.dimensionValues;

				return <DetailsPermaLinks title={ title } path={ url } />;
			},
		},
		{
			title: __( 'Pageviews', 'google-site-kit' ),
			description: __( 'Pageviews', 'google-site-kit' ),
			field: 'metricValues.0.value',
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
			),
		},
	];

	return (
		/* TODO: decouple the styles from search-console class */
		<div className="googlesitekit-search-console-widget">
			<h3>
				{ __( 'Top content over the last 28 days', 'google-site-kit' ) }
			</h3>
			<TableOverflowContainer>
				<ReportTable
					rows={ rows }
					columns={ tableColumns }
					limit={ 5 }
					gatheringData={ isGatheringData }
					zeroState={ ZeroDataMessage }
				/>
			</TableOverflowContainer>
		</div>
	);
}
