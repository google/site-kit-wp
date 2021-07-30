/**
 * ModulePopularKeywordsWidget component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { numFmt } from '../../../../../util';
import { MODULES_SEARCH_CONSOLE, STORE_NAME, DATE_RANGE_OFFSET } from '../../../datastore/constants';
import PreviewTable from '../../../../../components/PreviewTable';
import Link from '../../../../../components/Link';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import TableOverflowContainer from '../../../../../components/TableOverflowContainer';
import ReportTable from '../../../../../components/ReportTable';
import { isZeroReport } from '../../../util/is-zero-report';
import { generateDateRangeArgs } from '../../../util/report-date-range-args';
import Header from './Header';
import Footer from './Footer';

const { useSelect } = Data;

function ModulePopularKeywordsWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const {
		data,
		isLoading,
		error,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );

		const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } );

		const reportArgs = {
			startDate,
			endDate,
			dimensions: 'query',
			limit: 10,
		};

		return {
			data: store.getReport( reportArgs ),
			isLoading: ! store.hasFinishedResolution( 'getReport', [ reportArgs ] ),
			error: store.getErrorForSelector( 'getReport', [ reportArgs ] ),
		};
	} );

	if ( isLoading ) {
		return (
			<Widget noPadding Header={ Header } Footer={ Footer }>
				<PreviewTable padding />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportError moduleSlug="search-console" error={ error } />
			</Widget>
		);
	}

	if ( isZeroReport( data ) ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportZero moduleSlug="search-console" />
			</Widget>
		);
	}

	const tableColumns = [
		{
			title: __( 'Keyword', 'google-site-kit' ),
			description: __( 'Most searched for keywords related to your content', 'google-site-kit' ),
			primary: true,
			field: 'keys.0',
			Component: ( { fieldValue } ) => {
				const searchAnalyticsURL = useSelect( ( select ) => {
					const { startDate, endDate } = select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } );
					return select( MODULES_SEARCH_CONSOLE ).getServiceReportURL( {
						...generateDateRangeArgs( { startDate, endDate } ),
						query: `!${ fieldValue }`,
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
		<Widget noPadding Header={ Header } Footer={ Footer }>
			<TableOverflowContainer>
				<ReportTable rows={ data } columns={ tableColumns } />
			</TableOverflowContainer>
		</Widget>
	);
}

ModulePopularKeywordsWidget.propTypes = {
	Widget: PropTypes.func.isRequired,
	WidgetReportZero: PropTypes.func.isRequired,
	WidgetReportError: PropTypes.func.isRequired,
};

export default ModulePopularKeywordsWidget;
