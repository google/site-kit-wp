/**
 * MostEngagingPagesWidget component.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	CORE_USER,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import Link from '../../../../components/Link';
import { ZeroDataMessage } from '../../../analytics/components/common';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import useViewOnly from '../../../../hooks/useViewOnly';
import { numFmt } from '../../../../util';
const { useSelect, useInViewSelect } = Data;

function MostEngagingPagesWidget( props ) {
	const { Widget } = props;

	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const pageViewsReportOptions = {
		...dates,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		limit: 1,
	};

	const pageViewsReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( pageViewsReportOptions )
	);

	const averagePageViews =
		Math.round(
			pageViewsReport?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value /
				pageViewsReport?.rowCount
		) || 0;

	const reportOptions = {
		...dates,
		dimensions: [ 'pagePath' ],
		metrics: [ 'engagementRate', 'screenPageViews' ],
		orderby: [
			{
				metric: { metricName: 'engagementRate' },
				desc: true,
			},
			{
				metric: { metricName: 'screenPageViews' },
				desc: true,
			},
		],
		metricFilters: {
			screenPageViews: {
				filterType: 'numericFilter',
				operation: 'GREATER_THAN_OR_EQUAL',
				value: { int64Value: averagePageViews },
			},
		},
		limit: 3,
	};

	const pageViewsReportErrors = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			pageViewsReportOptions,
		] )
	);

	const error = useSelect( ( select ) => {
		const reportOptionsErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ reportOptions ] );

		if ( pageViewsReportErrors && reportOptionsErrors ) {
			return [ pageViewsReportErrors, reportOptionsErrors ];
		}

		return pageViewsReportErrors || reportOptionsErrors || undefined;
	} );

	const hasFinishedResolvingPageViewReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
			pageViewsReportOptions,
		] )
	);

	const report = useInViewSelect( ( select ) => {
		if ( ! hasFinishedResolvingPageViewReport ) {
			return undefined;
		}
		if ( pageViewsReportErrors ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getReport( reportOptions );
	} );

	const titles = useInViewSelect( ( select ) =>
		! error
			? select( MODULES_ANALYTICS_4 ).getPageTitles(
					report,
					reportOptions
			  )
			: undefined
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			) ||
			! hasFinishedResolvingPageViewReport ||
			titles === undefined
	);

	const { rows = [] } = report || {};

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	const columns = [
		{
			field: 'dimensionValues.0.value',
			Component: ( { fieldValue } ) => {
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
			Component: ( { fieldValue } ) => (
				<strong>{ numFmt( fieldValue, format ) }</strong>
			),
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_MOST_ENGAGING_PAGES }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

MostEngagingPagesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( MostEngagingPagesWidget );
