/**
 * Overview component for SearchFunnelWidgetGA4.
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
import { isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Grid, Row, Cell } from '../../../../../../material-components';
import { extractSearchConsoleDashboardData } from '../../../../util';
import { calculateChange, trackEvent } from '../../../../../../util';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../../../analytics-4/datastore/constants';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
	DASHBOARD_TYPE_ENTITY,
} from '../../../../../../hooks/useDashboardType';
import DataBlock from '../../../../../../components/DataBlock';
import useViewOnly from '../../../../../../hooks/useViewOnly';
import useViewContext from '../../../../../../hooks/useViewContext';
import OptionalCells from './OptionalCells';
import NewBadge from '../../../../../../components/NewBadge';
import ga4Reporting from '../../../../../../feature-tours/ga4-reporting';
const { useSelect, useDispatch, useInViewSelect } = Data;

function getDatapointAndChange( report, selectedStat, divider = 1 ) {
	return {
		datapoint:
			report?.totals?.[ 0 ]?.metricValues?.[ selectedStat ]?.value /
			divider,
		change: calculateChange(
			report?.totals?.[ 1 ]?.metricValues?.[ selectedStat ]?.value,
			report?.totals?.[ 0 ]?.metricValues?.[ selectedStat ]?.value
		),
	};
}

export default function Overview( props ) {
	const {
		ga4Data,
		ga4ConversionsData,
		ga4VisitorsData,
		searchConsoleData,
		selectedStats,
		handleStatsSelection,
		dateRangeLength,
		error,
		WidgetReportError,
		showRecoverableAnalytics,
	} = props;

	const dashboardType = useDashboardType();

	const viewOnly = useViewOnly();
	const viewContext = useViewContext();

	const isAnalytics4ModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics-4' )
	);

	const canViewSharedAnalytics4 = useSelect( ( select ) => {
		if ( ! isAnalytics4ModuleAvailable ) {
			return false;
		}

		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'analytics-4' );
	} );

	const canShowGA4ReportingFeatureTour = useSelect( ( select ) => {
		return select( CORE_UI ).getValue( 'showGA4ReportingTour' );
	} );

	const ga4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const ga4ModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics-4' )
	);
	const isGA4GatheringData = useInViewSelect( ( select ) =>
		ga4ModuleConnected
			? select( MODULES_ANALYTICS_4 ).isGatheringData()
			: false
	);
	const isSearchConsoleGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);
	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);

	const engagementRateLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/12195621',
		} )
	);

	const {
		totalClicks,
		totalImpressions,
		totalClicksChange,
		totalImpressionsChange,
	} = extractSearchConsoleDashboardData( searchConsoleData, dateRangeLength );

	let ga4ConversionsChange = null;
	let ga4ConversionsDatapoint = null;
	let ga4EngagementRateDatapoint = null;
	let ga4EngagementRateChange = null;
	let ga4VisitorsDatapoint = null;
	let ga4VisitorsChange = null;

	if (
		ga4ModuleActive &&
		isPlainObject( ga4Data ) &&
		isPlainObject( ga4VisitorsData )
	) {
		( { change: ga4ConversionsChange } = getDatapointAndChange(
			ga4Data,
			0,
			100
		) );
		ga4ConversionsDatapoint =
			ga4Data?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value;

		( {
			datapoint: ga4EngagementRateDatapoint,
			change: ga4EngagementRateChange,
		} = getDatapointAndChange( ga4Data, 1 ) );

		ga4VisitorsDatapoint =
			ga4VisitorsData?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value;
		( { change: ga4VisitorsChange } = getDatapointAndChange(
			ga4VisitorsData,
			0,
			100
		) );
	}

	const showGA4 =
		canViewSharedAnalytics4 &&
		ga4ModuleConnected &&
		! error &&
		! showRecoverableAnalytics;

	const { triggerOnDemandTour } = useDispatch( CORE_USER );
	useEffect( () => {
		if (
			! showGA4 ||
			! canShowGA4ReportingFeatureTour ||
			dashboardType !== DASHBOARD_TYPE_MAIN
		) {
			return;
		}

		triggerOnDemandTour( ga4Reporting );
	}, [
		showGA4,
		dashboardType,
		triggerOnDemandTour,
		canShowGA4ReportingFeatureTour,
	] );

	const onGA4NewBadgeLearnMoreClick = useCallback( () => {
		trackEvent( `${ viewContext }_ga4-new-badge`, 'click_learn_more_link' );
	}, [ viewContext ] );

	const showConversionsCTA =
		isAuthenticated &&
		showGA4 &&
		dashboardType === DASHBOARD_TYPE_MAIN &&
		( ! ga4ConversionsData?.length ||
			// Show the CTA if the sole conversion set up is the
			// GA4 default "purchase" conversion event with no data value.
			( ga4ConversionsData?.length === 1 &&
				ga4ConversionsData[ 0 ].eventName === 'purchase' &&
				ga4ConversionsDatapoint === '0' ) );

	const quarterCellProps = {
		smSize: 2,
		mdSize: showConversionsCTA ? 4 : 2,
		lgSize: 3,
	};

	const oneThirdCellProps = {
		smSize: 2,
		mdSize: 4,
		lgSize: 4,
	};

	const halfCellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 6,
	};

	const threeQuartersCellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 9,
	};

	const fullCellProps = {
		smSize: 4,
		mdSize: 8,
		lgSize: 12,
	};

	// Collection of all the data blocks to be displayed
	const dataBlocks = [
		{
			id: 'impressions',
			stat: 0,
			title: __( 'Total Impressions', 'google-site-kit' ),
			datapoint: totalImpressions,
			change: totalImpressionsChange,
			isGatheringData: isSearchConsoleGatheringData,
		},
		{
			id: 'clicks',
			stat: 1,
			title: __( 'Total Clicks', 'google-site-kit' ),
			datapoint: totalClicks,
			change: totalClicksChange,
			isGatheringData: isSearchConsoleGatheringData,
		},
		...( showGA4
			? [
					{
						id: 'visitors',
						stat: 2,
						title: __(
							'Unique Visitors from Search',
							'google-site-kit'
						),
						datapoint: ga4VisitorsDatapoint,
						change: ga4VisitorsChange,
						isGatheringData: isGA4GatheringData,
					},
			  ]
			: [] ),
		...( showGA4 &&
		dashboardType === DASHBOARD_TYPE_MAIN &&
		! showConversionsCTA
			? [
					{
						id: 'conversions',
						stat: 3,
						title: __( 'Conversions', 'google-site-kit' ),
						datapoint: ga4ConversionsDatapoint,
						change: ga4ConversionsChange,
						isGatheringData: isGA4GatheringData,
					},
			  ]
			: [] ),
		...( showGA4 && dashboardType === DASHBOARD_TYPE_ENTITY
			? [
					{
						id: 'engagement-rate',
						stat: 4,
						title: __( 'Engagement Rate', 'google-site-kit' ),
						datapoint: ga4EngagementRateDatapoint,
						datapointUnit: '%',
						change: ga4EngagementRateChange,
						isGatheringData: isGA4GatheringData,
						badge: (
							<NewBadge
								tooltipTitle={ __(
									'Sessions which lasted 10 seconds or longer, had 1 or more conversion events, or 2 or more page views.',
									'google-site-kit'
								) }
								learnMoreLink={ engagementRateLearnMoreURL }
								onLearnMoreClick={ onGA4NewBadgeLearnMoreClick }
							/>
						),
					},
			  ]
			: [] ),
	];

	const dataBlockWrapperCellProps = {
		2: halfCellProps,
		3: threeQuartersCellProps,
		4: fullCellProps,
	};

	const dataBlockCellProps = {
		2: {
			...halfCellProps,
			smSize: 2,
		},
		3: oneThirdCellProps,
		4: quarterCellProps,
	};

	// Check if any of the data blocks have a badge.
	//
	// If no data blocks have a badge, we shouldn't even render an
	// empty badge container, and save some vertical space in the `DataBlock`.
	const hasMetricWithBadge = dataBlocks.some( ( { badge } ) => {
		return !! badge;
	} );

	return (
		<Grid>
			<Row>
				<Cell { ...dataBlockWrapperCellProps[ dataBlocks.length ] }>
					<Row>
						{ dataBlocks.map( ( dataBlock, index ) => (
							<Cell
								key={ dataBlock.id }
								{ ...dataBlockCellProps[ dataBlocks.length ] }
							>
								<DataBlock
									stat={ dataBlock.stat }
									className={ `googlesitekit-data-block--${
										dataBlock.id
									} googlesitekit-data-block--button-${
										index + 1
									}` }
									title={ dataBlock.title }
									datapoint={ dataBlock.datapoint }
									datapointUnit={
										dataBlock.datapointUnit
											? dataBlock.datapointUnit
											: undefined
									}
									change={ dataBlock.change }
									changeDataUnit="%"
									context="button"
									selected={
										selectedStats === dataBlock.stat
									}
									handleStatSelection={ handleStatsSelection }
									gatheringData={ dataBlock.isGatheringData }
									badge={
										dataBlock.badge || hasMetricWithBadge
									}
								/>
							</Cell>
						) ) }
					</Row>
				</Cell>

				<OptionalCells
					canViewSharedAnalytics4={ canViewSharedAnalytics4 }
					error={ error }
					halfCellProps={ halfCellProps }
					quarterCellProps={ quarterCellProps }
					showGA4={ showGA4 }
					showConversionsCTA={ showConversionsCTA }
					showRecoverableAnalytics={ showRecoverableAnalytics }
					WidgetReportError={ WidgetReportError }
				/>
			</Row>
		</Grid>
	);
}

Overview.propTypes = {
	ga4Data: PropTypes.object,
	ga4ConversionsData: PropTypes.arrayOf( PropTypes.object ),
	ga4VisitorsData: PropTypes.object,
	searchConsoleData: PropTypes.arrayOf( PropTypes.object ),
	selectedStats: PropTypes.number.isRequired,
	handleStatsSelection: PropTypes.func.isRequired,
	error: PropTypes.object,
	WidgetReportError: PropTypes.elementType.isRequired,
};
