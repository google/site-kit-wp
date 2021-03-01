/**
 * ModulePopularPagesWidget component.
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
import PropTypes from 'prop-types';

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
	numFmt,
	untrailingslashit,
} from '../../../../util';
import { getDataTableFromData } from '../../../../components/data-table';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../datastore/constants';
import PreviewTable from '../../../../components/PreviewTable';
import SourceLink from '../../../../components/SourceLink';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import { isZeroReport } from '../util/is-zero-report';
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const { useSelect } = Data;

function ModulePopularPagesWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const domain = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const isDomainProperty = useSelect( ( select ) => select( STORE_NAME ).isDomainProperty() );
	const referenceSiteURL = useSelect( ( select ) => {
		return untrailingslashit( select( CORE_SITE ).getReferenceSiteURL() );
	} );
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ) );

	const data = useSelect( ( select ) => select( STORE_NAME ).getReport( {
		startDate,
		endDate,
		dimensions: 'query',
		limit: 10,
	} ) );

	const isLoading = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution() );

	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector() );

	const baseServiceURLArgs = {
		resource_id: domain,
		...generateDateRangeArgs( { startDate, endDate } ),
	};

	if ( url ) {
		baseServiceURLArgs.page = `!${ url }`;
	} else if ( isDomainProperty && referenceSiteURL ) {
		baseServiceURLArgs.page = `*${ referenceSiteURL }`;
	}

	const baseServiceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceURL(
		{
			path: '/performance/search-analytics',
			query: baseServiceURLArgs,
		}
	) );

	if ( ! isLoading ) {
		return <PreviewTable padding />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="search-console" error={ error } />;
	}

	if ( isZeroReport( data ) ) {
		return <WidgetReportZero moduleSlug="search-console" />;
	}

	const headers = [
		{
			title: __( 'Keyword', 'google-site-kit' ),
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
		<Widget
			noPadding
			Footer={ () => (
				<SourceLink
					className="googlesitekit-data-block__source"
					name={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
					href={ baseServiceURL }
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

ModulePopularPagesWidget.propTypes = {
	Widget: PropTypes.element,
	WidgetReportZero: PropTypes.element,
	WidgetReportError: PropTypes.element,
};

export default ModulePopularPagesWidget;
