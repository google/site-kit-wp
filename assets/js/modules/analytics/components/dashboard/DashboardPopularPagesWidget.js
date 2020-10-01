/**
 * DashboardPopularPagesWidget component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import PreviewTable from '../../../../components/preview-table';
import Layout from '../../../../components/layout/layout';
import { getDataTableFromData, TableOverflowContainer } from '../../../../components/data-table';
import { numberFormat } from '../../../../util';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import getNoDataComponent from '../../../../components/notifications/nodata';

const { useSelect } = Data;

function DashboardPopularPagesWidget() {
	const {
		data,
		error,
		loading,
		analyticsMainURL,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const args = {
			dateRange: select( CORE_USER ).getDateRange(),
			dimensions: 'ga:pageTitle,ga:pagePath',
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
		const accountID = select( STORE_NAME ).getAccountID();
		const profileID = select( STORE_NAME ).getProfileID();
		const internalWebPropertyID = select( STORE_NAME ).getInternalWebPropertyID();

		return {
			data: store.getReport( args ),
			error: store.getErrorForSelector( 'getReport', [ args ] ),
			loading: store.isResolving( 'getReport', [ args ] ),
			analyticsMainURL: store.getServiceURL( { path: `/report/content-pages/a${ accountID }w${ internalWebPropertyID }p${ profileID }` } ),
		};
	} );

	if ( loading ) {
		return <PreviewTable padding />;
	}

	if ( error ) {
		return getDataErrorComponent( _x( 'Analytics', 'Service name', 'google-site-kit' ), error.message, false, false, false, error );
	}

	if ( ! Array.isArray( data?.[ 0 ]?.data?.rows ) ) {
		return getNoDataComponent( _x( 'Analytics', 'Service name', 'google-site-kit' ) );
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
			numberFormat( row.metrics[ 0 ].values[ 0 ] ),
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
		<Layout
			className="googlesitekit-popular-content"
			footer
			footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
			footerCtaLink={ analyticsMainURL }
			fill
		>
			<TableOverflowContainer>
				{ dataTable }
			</TableOverflowContainer>
		</Layout>
	);
}

export default whenActive( { moduleName: 'analytics' } )( DashboardPopularPagesWidget );
