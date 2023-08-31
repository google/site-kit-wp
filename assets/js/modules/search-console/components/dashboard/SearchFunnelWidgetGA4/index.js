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
import { identity } from 'lodash';

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
import { DATE_RANGE_OFFSET as DATE_RANGE_OFFSET_ANALYTICS } from '../../../../analytics/datastore/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { numFmt } from '../../../../../util';
import PreviewBlock from '../../../../../components/PreviewBlock';
import Header from '../SearchFunnelWidget/Header';
import Footer from '../SearchFunnelWidget/Footer';
import Overview from './Overview';
import SearchConsoleStats from '../SearchFunnelWidget/SearchConsoleStats';
import { ActivateAnalyticsCTA, AnalyticsStats } from '../../common';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { Grid, Row, Cell } from '../../../../../material-components';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../../hooks/useBreakpoint';
import useViewOnly from '../../../../../hooks/useViewOnly';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
const { useSelect, useInViewSelect } = Data;

const SearchFunnelWidgetGA4 = ( { Widget, WidgetReportError } ) => {
	const [ selectedStats, setSelectedStats ] = useState( 0 );

	const breakpoint = useBreakpoint();

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
	const isGA4Active = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics-4' )
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

	const ga4ConversionsData = useInViewSelect( ( select ) => {
		return isGA4Connected &&
			canViewSharedAnalytics4 &&
			! showRecoverableAnalytics
			? select( MODULES_ANALYTICS_4 ).getConversionEvents()
			: [];
	} );

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

	const ga4OverviewData = useInViewSelect( ( select ) => {
		if (
			! isGA4Connected ||
			! canViewSharedAnalytics4 ||
			showRecoverableAnalytics
		) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getReport( ga4OverviewArgs );
	} );
	const ga4StatsData = useInViewSelect( ( select ) => {
		if (
			! isGA4Connected ||
			! canViewSharedAnalytics4 ||
			showRecoverableAnalytics
		) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getReport( ga4StatsArgs );
	} );
	const ga4VisitorsOverviewAndStatsData = useInViewSelect( ( select ) => {
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
	} );

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

	const isGA4GatheringData = useInViewSelect( ( select ) =>
		isGA4Connected && canViewSharedAnalytics4 && ! showRecoverableAnalytics
			? select( MODULES_ANALYTICS_4 ).isGatheringData()
			: false
	);
	const isSearchConsoleGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);

	const WidgetFooter = () => (
		<Footer
			metrics={ SearchFunnelWidgetGA4.metrics }
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

			{ ( selectedStats === 0 || selectedStats === 1 ) && (
				<SearchConsoleStats
					data={ searchConsoleData }
					dateRangeLength={ dateRangeLength }
					selectedStats={ selectedStats }
					metrics={ SearchFunnelWidgetGA4.metrics }
					gatheringData={ isSearchConsoleGatheringData }
				/>
			) }

			{ canViewSharedAnalytics4 &&
				( ! isGA4Active || ! isGA4Connected ) &&
				BREAKPOINT_SMALL === breakpoint && (
					<Grid>
						<Row>
							<Cell>
								<ActivateAnalyticsCTA
									title={ __(
										'Conversions completed',
										'google-site-kit'
									) }
								/>
							</Cell>
						</Row>
					</Grid>
				) }

			{ selectedStats === 2 && (
				<AnalyticsStats
					data={ ga4VisitorsOverviewAndStatsData }
					dateRangeLength={ dateRangeLength }
					selectedStats={ 0 }
					metrics={ SearchFunnelWidgetGA4.metrics }
					dataLabels={ [
						__( 'Unique Visitors', 'google-site-kit' ),
					] }
					tooltipDataFormats={ [
						( x ) => parseFloat( x ).toLocaleString(),
					] }
					statsColor={
						SearchFunnelWidgetGA4.metrics[ selectedStats ].color
					}
					gatheringData={ isGA4GatheringData }
					moduleSlug="analytics-4"
				/>
			) }

			{ canViewSharedAnalytics4 &&
				( selectedStats === 3 || selectedStats === 4 ) && (
					<AnalyticsStats
						data={ ga4StatsData }
						dateRangeLength={ dateRangeLength }
						// The selected stats order defined in the parent component does not match the order from the API.
						selectedStats={ selectedStats - 3 }
						metrics={ SearchFunnelWidgetGA4.metrics }
						dataLabels={ [
							__( 'Conversions', 'google-site-kit' ),
							__( 'Engagement Rate %', 'google-site-kit' ),
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
						chartDataFormats={ [ identity, ( x ) => x * 100 ] }
						statsColor={
							SearchFunnelWidgetGA4.metrics[ selectedStats ].color
						}
						gatheringData={ isGA4GatheringData }
						moduleSlug="analytics-4"
					/>
				) }
		</Widget>
	);
};

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
		color: '#bed4ff',
		label: __( 'Clicks', 'google-site-kit' ),
		metric: 'clicks',
		service: 'search-console',
	},
	{
		id: 'users',
		color: '#5c9271',
		label: __( 'Users', 'google-site-kit' ),
		service: 'analytics-4',
	},
	{
		id: 'coversions',
		color: '#6e48ab',
		label: __( 'Coversions', 'google-site-kit' ),
		service: 'analytics-4',
	},
	{
		id: 'engagement-rate',
		color: '#6e48ab',
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
