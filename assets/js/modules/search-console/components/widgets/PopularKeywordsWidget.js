/**
 * PopularKeywordsWidget component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '@/js/components/KeyMetrics';
import Link from '@/js/components/Link';
import {
	CORE_USER,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { ZeroDataMessage } from '@/js/modules/search-console/components/common';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { generateDateRangeArgs } from '@/js/modules/search-console/util';
import { numFmt } from '@/js/util';

/**
 * Builds the report options for the Popular Keywords widget.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates The date range dates, e.g. `startDate` and `endDate`.
 * @return {Object} The Search Console report options.
 */
export function getPopularKeywordsReportOptions( dates ) {
	return {
		...dates,
		dimensions: 'query',
		limit: 100,
		reportID: 'search-console_popular-keywords-widget_widget_reportOptions',
	};
}

/**
 * Builds the Search Console URL a popular-keyword row links to: the search
 * analytics report for an exact match on that keyword. Returns `undefined`
 * on a view-only export/dashboard, where the row renders no link.
 *
 * The exclamation mark at the beginning of the query specifies that the term
 * should be treated as an exact match on the SC search results page.
 *
 * @since n.e.x.t
 *
 * @param {Object}   params                     Link parameters.
 * @param {Function} params.getServiceReportURL The Search Console store's `getServiceReportURL` selector.
 * @param {Object}   params.dates               The date range dates, e.g. `startDate` and `endDate`.
 * @param {string}   params.keyword             The keyword to filter to.
 * @param {boolean}  params.viewOnly            Whether the dashboard/export is view-only.
 * @return {string|undefined} The report URL, or `undefined` when unlinked.
 */
export function getPopularKeywordReportURL( {
	getServiceReportURL,
	dates,
	keyword,
	viewOnly,
} ) {
	if ( viewOnly ) {
		return undefined;
	}

	return getServiceReportURL( {
		...generateDateRangeArgs( dates ),
		query: `!${ keyword }`,
	} );
}

export default function PopularKeywordsWidget( { Widget } ) {
	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates()
	);

	const reportOptions = getPopularKeywordsReportOptions( dates );

	const report = useInViewSelect(
		( select ) =>
			select( MODULES_SEARCH_CONSOLE ).getReport( reportOptions ),
		[ reportOptions ]
	);

	const error = useSelect(
		( select ) =>
			select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [
				reportOptions,
			] ),
		[ reportOptions ]
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			)
	);

	const columns = [
		{
			field: 'keys.0',
			Component( { fieldValue } ) {
				const searchAnalyticsURL = useSelect( ( select ) =>
					getPopularKeywordReportURL( {
						getServiceReportURL: select( MODULES_SEARCH_CONSOLE )
							.getServiceReportURL,
						dates,
						keyword: fieldValue,
						viewOnly: viewOnlyDashboard,
					} )
				);

				if ( viewOnlyDashboard ) {
					return <MetricTileTablePlainText content={ fieldValue } />;
				}

				return (
					<Link
						href={ searchAnalyticsURL }
						external
						hideExternalIndicator
					>
						{ fieldValue }
					</Link>
				);
			},
		},
		{
			field: 'ctr',
			Component( { fieldValue } ) {
				return (
					<strong>
						{ sprintf(
							/* translators: %s: clickthrough rate value */
							__( '%s CTR', 'google-site-kit' ),
							numFmt( fieldValue, '%' )
						) }
					</strong>
				);
			},
		},
	];

	const rows = [ ...( report || [] ) ].sort(
		( { ctr: ctrA = 0 }, { ctr: ctrB = 0 } ) => ctrB - ctrA
	);

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			limit={ 3 }
			error={ error }
			moduleSlug="search-console"
		/>
	);
}

PopularKeywordsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
