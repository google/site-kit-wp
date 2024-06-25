/**
 * TopRecentTrendingPagesWidget component.
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
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import Link from '../../../../components/Link';
import { ZeroDataMessage } from '../common';
import { getPreviousDate, numFmt } from '../../../../util';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import useViewOnly from '../../../../hooks/useViewOnly';
import withCustomDimensions from '../../utils/withCustomDimensions';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
} from '../../../../googlesitekit/datastore/user/constants';
const { useSelect, useInViewSelect } = Data;

/**
 * Computes the dates for the last three days relative to today (reference date).
 *
 * Utilizing the current date, the function calculates the dates
 * for the previous day, two days ago, and three days ago.
 *
 * @since 1.113.0
 *
 * @param {Function} select Registry select.
 * @return {Object} An object containing the dates for yesterday,
 *                  two days ago, and three days ago.
 */
export const getDates = ( select ) => {
	const todayDateString = select( CORE_USER ).getReferenceDate();

	const yesterday = getPreviousDate( todayDateString, 1 );
	const twoDaysAgo = getPreviousDate( todayDateString, 2 );
	const threeDaysAgo = getPreviousDate( todayDateString, 3 );

	return {
		yesterday,
		twoDaysAgo,
		threeDaysAgo,
	};
};

/**
 * Returns the date range (eg. the `startDate` and `endDate`) for this widget's
 * reporting options.
 *
 * @since 1.113.0
 *
 * @param {Function} select Registry select.
 * @return {Object} An object containing the `startDate` and `endDate` for a
 * report.
 */
export const getDateRange = ( select ) => {
	const { yesterday, threeDaysAgo } = getDates( select );

	return {
		startDate: threeDaysAgo,
		endDate: yesterday,
	};
};

/**
 * Generates the report options required for fetching data in
 * `topRecentTrendingPagesWidget`.
 *
 * The function utilizes the dates from the last three days to
 * prepare the filter and structure required for the report.
 *
 * This is defined as a function outside the component so that both
 * the component and the higher-order-component (`withCustomDimensions`)
 * can use it.
 *
 * @since 1.113.0
 *
 * @param {Function} select Registry select.
 * @return {Object} The report options containing dimensions, filters,
 * metrics, and other parameters.
 */
export const getReportOptions = ( select ) => {
	const { yesterday, twoDaysAgo, threeDaysAgo } = getDates( select );

	const dates = getDateRange( select );

	const reportOptions = {
		...dates,
		dimensions: [ 'pagePath' ],
		dimensionFilters: {
			'customEvent:googlesitekit_post_date': {
				filterType: 'inListFilter',
				value: [
					yesterday.replace( /-/g, '' ),
					twoDaysAgo.replace( /-/g, '' ),
					threeDaysAgo.replace( /-/g, '' ),
				],
			},
		},
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 3,
	};

	return reportOptions;
};

function TopRecentTrendingPagesWidget( { Widget } ) {
	const viewOnlyDashboard = useViewOnly();
	const dates = useSelect( getDateRange );
	const reportOptions = useSelect( getReportOptions );

	const report = useInViewSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
		[ reportOptions ]
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportOptions,
		] )
	);

	const titles = useInViewSelect(
		( select ) =>
			! error && report
				? select( MODULES_ANALYTICS_4 ).getPageTitles(
						report,
						reportOptions
				  )
				: undefined,
		[ error, report, reportOptions ]
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			) || titles === undefined
	);

	const { rows = [] } = report || {};

	const columns = [
		{
			field: 'dimensionValues.0.value',
			Component( { fieldValue } ) {
				const url = fieldValue;
				const title = titles[ url ];
				// Utilizing `useSelect` inside the component rather than
				// returning its direct value to the `columns` array.
				// This pattern ensures that the component re-renders correctly based on changes in state,
				// preventing potential issues with stale or out-of-sync data.
				// Note: This pattern is replicated in a few other spots within our codebase.
				const serviceURL = useSelect( ( select ) => {
					return ! viewOnlyDashboard
						? select( MODULES_ANALYTICS_4 ).getServiceReportURL(
								'all-pages-and-screens',
								{
									filters: {
										unifiedPagePathScreen: url,
									},
									dates,
								}
						  )
						: null;
				} );

				if ( viewOnlyDashboard ) {
					return <MetricTileTablePlainText content={ title } />;
				}

				return (
					<Link
						href={ serviceURL }
						title={ title }
						external
						hideExternalIndicator
					>
						{ title }
					</Link>
				);
			},
		},
		{
			field: 'metricValues.0.value',
			Component( { fieldValue } ) {
				return <strong>{ numFmt( fieldValue ) }</strong>;
			},
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopRecentTrendingPagesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default compose(
	whenActive( {
		moduleName: 'analytics-4',
		FallbackComponent: ConnectGA4CTATileWidget,
	} ),
	withCustomDimensions( {
		reportOptions: getReportOptions,
	} )
)( TopRecentTrendingPagesWidget );
