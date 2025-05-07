/**
 * SearchFunnelWidgetGA4 component.
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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import {
	MODULES_SEARCH_CONSOLE,
	DATE_RANGE_OFFSET,
} from '../../../datastore/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import PreviewBlock from '../../../../../components/PreviewBlock';
import Header from './Header';
import Footer from './Footer';
import Overview from './Overview';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import useViewOnly from '../../../../../hooks/useViewOnly';
import {
	MODULES_ANALYTICS_4,
	DATE_RANGE_OFFSET as DATE_RANGE_OFFSET_ANALYTICS,
} from '../../../../analytics-4/datastore/constants';
import Chart from './Chart';

function SearchFunnelWidgetGA4( { Widget, WidgetReportError } ) {
	const [ selectedStats, setSelectedStats ] = useState( 0 );

	const viewOnly = useViewOnly();

	const isAnalytics4Available = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics-4' )
	);

	const canViewSharedAnalytics4 = useSelect( ( select ) => {
		if ( ! isAnalytics4Available ) {
			return false;
		}

		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'analytics-4' );
	} );

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const dateRangeLength = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);
	const url = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const { endDate, compareStartDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);
	const ga4Dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET_ANALYTICS,
		} )
	);

	const showRecoverableAnalytics = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return false;
		}

		const recoverableModules =
			select( CORE_MODULES ).getRecoverableModules();

		if ( recoverableModules === undefined ) {
			return undefined;
		}

		return Object.keys( recoverableModules ).includes( 'analytics-4' );
	} );

	const ga4ConversionsData = useInViewSelect(
		( select ) => {
			return isGA4Connected &&
				canViewSharedAnalytics4 &&
				! showRecoverableAnalytics
				? select( MODULES_ANALYTICS_4 ).getConversionEvents()
				: [];
		},
		[ isGA4Connected, canViewSharedAnalytics4, showRecoverableAnalytics ]
	);

	const searchConsoleReportArgs = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
	};

	const ga4OverviewArgs = {
		...ga4Dates,
		metrics: [
			{
				name: 'conversions',
			},
			{
				name: 'engagementRate',
			},
		],
		dimensionFilters: {
			sessionDefaultChannelGrouping: [ 'Organic Search' ],
		},
	};

	const ga4StatsArgs = {
		...ga4Dates,
		...ga4OverviewArgs,
		dimensions: [
			{
				name: 'date',
			},
		],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
	};
	const ga4VisitorsOverviewAndStatsArgs = {
		...ga4Dates,
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		dimensions: [
			{
				name: 'date',
			},
		],
		dimensionFilters: {
			sessionDefaultChannelGrouping: [ 'Organic Search' ],
		},
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
	};

	if ( isURL( url ) ) {
		searchConsoleReportArgs.url = url;
		ga4OverviewArgs.url = url;
		ga4StatsArgs.url = url;
		ga4VisitorsOverviewAndStatsArgs.url = url;
	}

	const searchConsoleData = useInViewSelect(
		( select ) =>
			select( MODULES_SEARCH_CONSOLE ).getReport(
				searchConsoleReportArgs
			),
		[ searchConsoleReportArgs ]
	);
	const searchConsoleError = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [
			searchConsoleReportArgs,
		] )
	);

	const searchConsoleLoading = useSelect(
		( select ) =>
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'getReport',
				[ searchConsoleReportArgs ]
			)
	);

	const ga4OverviewData = useInViewSelect(
		( select ) => {
			if (
				! isGA4Connected ||
				! canViewSharedAnalytics4 ||
				showRecoverableAnalytics
			) {
				return null;
			}

			return select( MODULES_ANALYTICS_4 ).getReport( ga4OverviewArgs );
		},
		[
			isGA4Connected,
			canViewSharedAnalytics4,
			showRecoverableAnalytics,
			ga4OverviewArgs,
		]
	);
	const ga4StatsData = useInViewSelect(
		( select ) => {
			if (
				! isGA4Connected ||
				! canViewSharedAnalytics4 ||
				showRecoverableAnalytics
			) {
				return null;
			}

			return select( MODULES_ANALYTICS_4 ).getReport( ga4StatsArgs );
		},
		[
			isGA4Connected,
			canViewSharedAnalytics4,
			showRecoverableAnalytics,
			ga4StatsArgs,
		]
	);
	const ga4VisitorsOverviewAndStatsData = useInViewSelect(
		( select ) => {
			if (
				! isGA4Connected ||
				! canViewSharedAnalytics4 ||
				showRecoverableAnalytics
			) {
				return null;
			}

			return select( MODULES_ANALYTICS_4 ).getReport(
				ga4VisitorsOverviewAndStatsArgs
			);
		},
		[
			isGA4Connected,
			canViewSharedAnalytics4,
			showRecoverableAnalytics,
			ga4VisitorsOverviewAndStatsArgs,
		]
	);

	const ga4Loading = useSelect( ( select ) => {
		if (
			! isGA4Connected ||
			! canViewSharedAnalytics4 ||
			showRecoverableAnalytics
		) {
			return false;
		}

		const { hasFinishedResolution } = select( MODULES_ANALYTICS_4 );

		return ! (
			hasFinishedResolution( 'getReport', [ ga4OverviewArgs ] ) &&
			hasFinishedResolution( 'getReport', [ ga4StatsArgs ] ) &&
			hasFinishedResolution( 'getReport', [
				ga4VisitorsOverviewAndStatsArgs,
			] ) &&
			hasFinishedResolution( 'getConversionEvents', [] )
		);
	} );

	const ga4Error = useSelect( ( select ) => {
		if ( ! isGA4Connected || showRecoverableAnalytics ) {
			return null;
		}

		const { getErrorForSelector } = select( MODULES_ANALYTICS_4 );

		return (
			getErrorForSelector( 'getReport', [ ga4OverviewArgs ] ) ||
			getErrorForSelector( 'getReport', [ ga4StatsArgs ] ) ||
			getErrorForSelector( 'getReport', [
				ga4VisitorsOverviewAndStatsArgs,
			] ) ||
			getErrorForSelector( 'getConversionEvents', [] )
		);
	} );

	const isGA4GatheringData = useInViewSelect(
		( select ) =>
			isGA4Connected &&
			canViewSharedAnalytics4 &&
			! showRecoverableAnalytics
				? select( MODULES_ANALYTICS_4 ).isGatheringData()
				: false,
		[ isGA4Connected, canViewSharedAnalytics4, showRecoverableAnalytics ]
	);
	const isSearchConsoleGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);

	function WidgetFooter() {
		return (
			<Footer
				metrics={ SearchFunnelWidgetGA4.metrics }
				selectedStats={ selectedStats }
			/>
		);
	}

	if ( searchConsoleError ) {
		return (
			<Widget Header={ Header } Footer={ WidgetFooter }>
				<WidgetReportError
					moduleSlug="search-console"
					error={ searchConsoleError }
				/>
			</Widget>
		);
	}

	if (
		searchConsoleLoading ||
		ga4Loading ||
		isGA4GatheringData === undefined ||
		isSearchConsoleGatheringData === undefined
	) {
		return (
			<Widget Header={ Header } Footer={ WidgetFooter } noPadding>
				<PreviewBlock width="100%" height="190px" padding />
				<PreviewBlock width="100%" height="270px" padding />
			</Widget>
		);
	}

	return (
		<Widget noPadding Header={ Header } Footer={ WidgetFooter }>
			<Overview
				ga4Data={ ga4OverviewData }
				ga4ConversionsData={ ga4ConversionsData }
				ga4VisitorsData={ ga4VisitorsOverviewAndStatsData }
				searchConsoleData={ searchConsoleData }
				handleStatsSelection={ setSelectedStats }
				selectedStats={ selectedStats }
				dateRangeLength={ dateRangeLength }
				error={ ga4Error }
				WidgetReportError={ WidgetReportError }
				showRecoverableAnalytics={ showRecoverableAnalytics }
			/>

			<Chart
				canViewSharedAnalytics4={ canViewSharedAnalytics4 }
				dateRangeLength={ dateRangeLength }
				ga4StatsData={ ga4StatsData }
				ga4VisitorsOverviewAndStatsData={
					ga4VisitorsOverviewAndStatsData
				}
				isGA4Connected={ isGA4Connected }
				isGA4GatheringData={ isGA4GatheringData }
				isSearchConsoleGatheringData={ isSearchConsoleGatheringData }
				metrics={ SearchFunnelWidgetGA4.metrics }
				searchConsoleData={ searchConsoleData }
				selectedStats={ selectedStats }
				showRecoverableAnalytics={ showRecoverableAnalytics }
			/>
		</Widget>
	);
}

SearchFunnelWidgetGA4.metrics = [
	{
		id: 'impressions',
		color: '#6380b8',
		label: __( 'Impressions', 'google-site-kit' ),
		metric: 'impressions',
		service: 'search-console',
	},
	{
		id: 'clicks',
		color: '#4bbbbb',
		label: __( 'Clicks', 'google-site-kit' ),
		metric: 'clicks',
		service: 'search-console',
	},
	{
		id: 'users',
		color: '#3c7251',
		label: __( 'Users', 'google-site-kit' ),
		service: 'analytics-4',
	},
	{
		id: 'conversions',
		color: '#8e68cb',
		label: __( 'Conversions', 'google-site-kit' ),
		service: 'analytics-4',
	},
	{
		id: 'engagement-rate',
		color: '#8e68cb',
		label: __( 'Engagement Rate', 'google-site-kit' ),
		service: 'analytics-4',
	},
];

SearchFunnelWidgetGA4.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportZero: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};

export default SearchFunnelWidgetGA4;
