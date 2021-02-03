/**
 * LegacyDashboardWidgetPopularKeywordsTable component.
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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	getTimeInSeconds,
	numFmt,
	untrailingslashit,
} from '../../../../util';
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData } from '../../../../components/data-table';
import PreviewTable from '../../../../components/PreviewTable';
import Layout from '../../../../components/layout/Layout';
import {
	isDataZeroSearchConsole,
} from '../../util';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const { useSelect } = Data;

const LegacyDashboardWidgetPopularKeywordsTable = ( props ) => {
	const { data } = props;
	const domain = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const isDomainProperty = useSelect( ( select ) => select( STORE_NAME ).isDomainProperty() );
	const referenceSiteURL = useSelect( ( select ) => {
		return untrailingslashit( select( CORE_SITE ).getReferenceSiteURL() );
	} );
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ) );
	const baseServiceArgs = {
		resource_id: domain,
		...generateDateRangeArgs( { startDate, endDate } ),
	};
	if ( isDomainProperty && referenceSiteURL ) {
		baseServiceArgs.page = `*${ referenceSiteURL }`;
	}
	const baseServiceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceURL(
		{
			path: '/performance/search-analytics',
			query: baseServiceArgs,
		} ) );

	if ( ! data || ! data.length ) {
		return null;
	}

	const headers = [
		{
			title: __( 'Top search queries for your site', 'google-site-kit' ),
			tooltip: __( 'Most searched for keywords related to your content', 'google-site-kit' ),
			primary: true,
		},
		{
			title: __( 'Clicks', 'google-site-kit' ),
			tooltip: __( 'Number of times users clicked on your content in search results', 'google-site-kit' ),
		},
		{
			title: __( 'Impressions', 'google-site-kit' ),
			tooltip: __( 'Counted each time your content appears in search results', 'google-site-kit' ),
		},
	];
	const links = [];

	const dataMapped = data.map( ( row, i ) => {
		const query = row.keys[ 0 ];
		links[ i ] = addQueryArgs( baseServiceURL, { query: `!${ query }` } );
		return [
			query,
			numFmt( row.clicks, { style: 'decimal' } ),
			numFmt( row.impressions, { style: 'decimal' } ),
		];
	} );

	const options = {
		hideHeader: false,
		chartsEnabled: false,
		links,
	};

	const dataTable = getDataTableFromData( dataMapped, headers, options );

	return (
		<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-6-desktop
				mdc-layout-grid__cell--span-4-tablet
			">
			<Layout
				className="googlesitekit-popular-content"
				footer
				footerCTALabel={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
				footerCTALink={ baseServiceURL }
				fill
			>
				<TableOverflowContainer>
					{ dataTable }
				</TableOverflowContainer>
			</Layout>
		</div>
	);
};

export default withData(
	LegacyDashboardWidgetPopularKeywordsTable,
	[
		{
			type: TYPE_MODULES,
			identifier: 'search-console',
			datapoint: 'searchanalytics',
			data: {
				dimensions: 'query',
				limit: 10,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Dashboard' ],
		},
	],
	<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet">
		<Layout className="googlesitekit-popular-content" fill>
			<PreviewTable padding />
		</Layout>
	</div>,
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZeroSearchConsole
);
