/**
 * SearchFunnelWidget component.
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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_SEARCH_CONSOLE,
	DATE_RANGE_OFFSET,
} from '../../../datastore/constants';
import {
	MODULES_ANALYTICS,
	DATE_RANGE_OFFSET as DATE_RANGE_OFFSET_ANALYTICS,
} from '../../../../analytics/datastore/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { numFmt } from '../../../../../util';
import PreviewBlock from '../../../../../components/PreviewBlock';
import UACutoffWarning from '../../../../analytics/components/common/UACutoffWarning';
import Header from './Header';
import Footer from './Footer';
import Overview from './Overview';
import SearchConsoleStats from './SearchConsoleStats';
import { ActivateAnalyticsCTA, AnalyticsStats } from '../../common';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { Grid, Row, Cell } from '../../../../../material-components';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import useViewOnly from '../../../../../hooks/useViewOnly';
const { useSelect, useInViewSelect } = Data;

const SearchFunnelWidget = ( { Widget, WidgetReportError } ) => {
	const [ selectedStats, setSelectedStats ] = useState( 0 );

	const breakpoint = useBreakpoint();

	const viewOnly = useViewOnly();

	const isAnalyticsAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics' )
	);

	const canViewSharedAnalytics = useSelect( ( select ) => {
		if ( ! isAnalyticsAvailable ) {
			return false;
		}

		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'analytics' );
	} );

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const isAnalyticsActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
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
	const analyticsDates = useSelect( ( select ) =>
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

		return Object.keys( recoverableModules ).includes( 'analytics' );
	} );

	const analyticsGoalsData = useInViewSelect( ( select ) => {
		return isAnalyticsConnected &&
			canViewSharedAnalytics &&
			! showRecoverableAnalytics
			? select( MODULES_ANALYTICS ).getGoals()
			: {};
	} );

	const searchConsoleReportArgs = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
	};

	const analyticsOverviewArgs = {
		...analyticsDates,
		metrics: [
			{
				expression: 'ga:goalCompletionsAll',
				alias: 'Goal Completions',
			},
			'ga:bounceRate',
		],
	};

	const analyticsStatsArgs = {
		...analyticsDates,
		...analyticsOverviewArgs,
		dimensions: 'ga:date',
	};
	const analyticsVisitorsOverviewAndStatsArgs = {
		...analyticsDates,
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		dimensions: [ 'ga:date' ],
		dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
	};

	if ( isURL( url ) ) {
		searchConsoleReportArgs.url = url;
		analyticsOverviewArgs.url = url;
		analyticsStatsArgs.url = url;
		analyticsVisitorsOverviewAndStatsArgs.url = url;
	}

	const searchConsoleData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getReport( searchConsoleReportArgs )
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

	const analyticsOverviewData = useInViewSelect( ( select ) => {
		if (
			! isAnalyticsConnected ||
			! canViewSharedAnalytics ||
			showRecoverableAnalytics
		) {
			return null;
		}

		return select( MODULES_ANALYTICS ).getReport( analyticsOverviewArgs );
	} );
	const analyticsStatsData = useInViewSelect( ( select ) => {
		if (
			! isAnalyticsConnected ||
			! canViewSharedAnalytics ||
			showRecoverableAnalytics
		) {
			return null;
		}

		return select( MODULES_ANALYTICS ).getReport( analyticsStatsArgs );
	} );
	const analyticsVisitorsOverviewAndStatsData = useInViewSelect(
		( select ) => {
			if (
				! isAnalyticsConnected ||
				! canViewSharedAnalytics ||
				showRecoverableAnalytics
			) {
				return null;
			}

			return select( MODULES_ANALYTICS ).getReport(
				analyticsVisitorsOverviewAndStatsArgs
			);
		}
	);

	const analyticsLoading = useSelect( ( select ) => {
		if (
			! isAnalyticsConnected ||
			! canViewSharedAnalytics ||
			showRecoverableAnalytics
		) {
			return false;
		}

		const { hasFinishedResolution } = select( MODULES_ANALYTICS );

		return ! (
			hasFinishedResolution( 'getReport', [ analyticsOverviewArgs ] ) &&
			hasFinishedResolution( 'getReport', [ analyticsStatsArgs ] ) &&
			hasFinishedResolution( 'getReport', [
				analyticsVisitorsOverviewAndStatsArgs,
			] ) &&
			hasFinishedResolution( 'getGoals', [] )
		);
	} );

	const analyticsError = useSelect( ( select ) => {
		if ( ! isAnalyticsConnected || showRecoverableAnalytics ) {
			return null;
		}

		const { getErrorForSelector } = select( MODULES_ANALYTICS );

		return (
			getErrorForSelector( 'getReport', [ analyticsOverviewArgs ] ) ||
			getErrorForSelector( 'getReport', [ analyticsStatsArgs ] ) ||
			getErrorForSelector( 'getReport', [
				analyticsVisitorsOverviewAndStatsArgs,
			] ) ||
			getErrorForSelector( 'getGoals', [] )
		);
	} );

	const isAnalyticsGatheringData = useInViewSelect( ( select ) =>
		isAnalyticsConnected &&
		canViewSharedAnalytics &&
		! showRecoverableAnalytics
			? select( MODULES_ANALYTICS ).isGatheringData()
			: false
	);
	const isSearchConsoleGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);

	const WidgetFooter = () => (
		<Footer
			metrics={ SearchFunnelWidget.metrics }
			selectedStats={ selectedStats }
		/>
	);

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
		analyticsLoading ||
		isAnalyticsGatheringData === undefined ||
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
			<UACutoffWarning />
			<Overview
				analyticsData={ analyticsOverviewData }
				analyticsGoalsData={ analyticsGoalsData }
				analyticsVisitorsData={ analyticsVisitorsOverviewAndStatsData }
				searchConsoleData={ searchConsoleData }
				handleStatsSelection={ setSelectedStats }
				selectedStats={ selectedStats }
				dateRangeLength={ dateRangeLength }
				error={ analyticsError }
				WidgetReportError={ WidgetReportError }
				showRecoverableAnalytics={ showRecoverableAnalytics }
			/>

			{ ( selectedStats === 0 || selectedStats === 1 ) && (
				<SearchConsoleStats
					data={ searchConsoleData }
					dateRangeLength={ dateRangeLength }
					selectedStats={ selectedStats }
					metrics={ SearchFunnelWidget.metrics }
					gatheringData={ isSearchConsoleGatheringData }
				/>
			) }

			{ canViewSharedAnalytics &&
				( ! isAnalyticsActive || ! isAnalyticsConnected ) &&
				BREAKPOINT_SMALL === breakpoint && (
					<Grid>
						<Row>
							<Cell>
								<ActivateAnalyticsCTA
									title={ __(
										'Goals completed',
										'google-site-kit'
									) }
								/>
							</Cell>
						</Row>
					</Grid>
				) }

			{ selectedStats === 2 && (
				<AnalyticsStats
					data={ analyticsVisitorsOverviewAndStatsData }
					dateRangeLength={ dateRangeLength }
					selectedStats={ 0 }
					metrics={ SearchFunnelWidget.metrics }
					dataLabels={ [
						__( 'Unique Visitors', 'google-site-kit' ),
					] }
					tooltipDataFormats={ [
						( x ) => parseFloat( x ).toLocaleString(),
					] }
					statsColor={
						SearchFunnelWidget.metrics[ selectedStats ].color
					}
					gatheringData={ isAnalyticsGatheringData }
					moduleSlug="analytics"
				/>
			) }

			{ canViewSharedAnalytics &&
				( selectedStats === 3 || selectedStats === 4 ) && (
					<AnalyticsStats
						data={ analyticsStatsData }
						dateRangeLength={ dateRangeLength }
						// The selected stats order defined in the parent component does not match the order from the API.
						selectedStats={ selectedStats - 3 }
						metrics={ SearchFunnelWidget.metrics }
						dataLabels={ [
							__( 'Goals', 'google-site-kit' ),
							__( 'Bounce Rate %', 'google-site-kit' ),
						] }
						tooltipDataFormats={ [
							( x ) => parseFloat( x ).toLocaleString(),
							( x ) =>
								numFmt( x / 100, {
									style: 'percent',
									signDisplay: 'never',
									maximumFractionDigits: 2,
								} ),
						] }
						statsColor={
							SearchFunnelWidget.metrics[ selectedStats ].color
						}
						gatheringData={ isAnalyticsGatheringData }
						moduleSlug="analytics"
					/>
				) }
		</Widget>
	);
};

SearchFunnelWidget.metrics = [
	{
		id: 'impressions',
		color: '#6380b8',
		label: __( 'Impressions', 'google-site-kit' ),
		metric: 'impressions',
		service: 'search-console',
	},
	{
		id: 'clicks',
		color: '#bed4ff',
		label: __( 'Clicks', 'google-site-kit' ),
		metric: 'clicks',
		service: 'search-console',
	},
	{
		id: 'users',
		color: '#5c9271',
		label: __( 'Users', 'google-site-kit' ),
		service: 'analytics',
	},
	{
		id: 'goals',
		color: '#6e48ab',
		label: __( 'Goals', 'google-site-kit' ),
		service: 'analytics',
	},
	{
		id: 'bounce-rate',
		color: '#6e48ab',
		label: __( 'Bounce Rate', 'google-site-kit' ),
		service: 'analytics',
	},
];

SearchFunnelWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportZero: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};

export default SearchFunnelWidget;
