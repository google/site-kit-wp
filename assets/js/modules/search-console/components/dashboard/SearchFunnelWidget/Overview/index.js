/**
 * Overview component for SearchFunnelWidget.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Grid, Row, Cell } from '../../../../../../material-components';
import { extractSearchConsoleDashboardData } from '../../../../util';
import { calculateChange } from '../../../../../../util';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../../datastore/constants';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
	DASHBOARD_TYPE_ENTITY,
} from '../../../../../../hooks/useDashboardType';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS } from '../../../../../analytics/datastore/constants';
import DataBlock from '../../../../../../components/DataBlock';
import useViewOnly from '../../../../../../hooks/useViewOnly';
import OptionalCells from './OptionalCells';
const { useSelect, useInViewSelect } = Data;

function getDatapointAndChange( [ report ], selectedStat, divider = 1 ) {
	return {
		datapoint:
			report?.data?.totals?.[ 0 ]?.values?.[ selectedStat ] / divider,
		change: calculateChange(
			report?.data?.totals?.[ 1 ]?.values?.[ selectedStat ],
			report?.data?.totals?.[ 0 ]?.values?.[ selectedStat ]
		),
	};
}

const Overview = ( {
	analyticsData,
	analyticsGoalsData,
	analyticsVisitorsData,
	searchConsoleData,
	selectedStats,
	handleStatsSelection,
	dateRangeLength,
	error,
	WidgetReportError,
	showRecoverableAnalytics,
} ) => {
	const dashboardType = useDashboardType();

	const viewOnly = useViewOnly();

	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics' )
	);

	const canViewSharedAnalytics = useSelect( ( select ) => {
		if ( ! analyticsModuleAvailable ) {
			return false;
		}

		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'analytics' );
	} );

	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);

	const isAnalyticsGatheringData = useInViewSelect(
		( select ) =>
			analyticsModuleConnected &&
			select( MODULES_ANALYTICS ).isGatheringData()
	);
	const isSearchConsoleGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);
	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);

	const {
		totalClicks,
		totalImpressions,
		totalClicksChange,
		totalImpressionsChange,
	} = extractSearchConsoleDashboardData( searchConsoleData, dateRangeLength );

	let analyticsGoalsChange = null;
	let analyticsGoalsDatapoint = null;
	let analyticsBounceDatapoint = null;
	let analyticsBounceChange = null;
	let analyticsVisitorsDatapoint = null;
	let analyticsVisitorsChange = null;

	if (
		analyticsModuleActive &&
		Array.isArray( analyticsData ) &&
		Array.isArray( analyticsVisitorsData )
	) {
		( { change: analyticsGoalsChange } = getDatapointAndChange(
			analyticsData,
			0,
			100
		) );
		analyticsGoalsDatapoint =
			analyticsData?.[ 0 ]?.data?.totals?.[ 0 ]?.values[ 0 ];

		( {
			datapoint: analyticsBounceDatapoint,
			change: analyticsBounceChange,
		} = getDatapointAndChange( analyticsData, 1, 100 ) );

		analyticsVisitorsDatapoint =
			analyticsVisitorsData?.[ 0 ]?.data?.totals?.[ 0 ]?.values[ 0 ];
		( { change: analyticsVisitorsChange } = getDatapointAndChange(
			analyticsVisitorsData,
			0,
			100
		) );
	}

	const showAnalytics =
		canViewSharedAnalytics &&
		analyticsModuleConnected &&
		! error &&
		! showRecoverableAnalytics;

	const showGoalsCTA =
		isAuthenticated &&
		showAnalytics &&
		dashboardType === DASHBOARD_TYPE_MAIN &&
		! analyticsGoalsData?.items?.length;

	const quarterCellProps = {
		smSize: 2,
		mdSize: showGoalsCTA ? 4 : 2,
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
		...( showAnalytics
			? [
					{
						id: 'visitors',
						stat: 2,
						title: __(
							'Unique Visitors from Search',
							'google-site-kit'
						),
						datapoint: analyticsVisitorsDatapoint,
						change: analyticsVisitorsChange,
						isGatheringData: isAnalyticsGatheringData,
					},
			  ]
			: [] ),
		...( showAnalytics &&
		dashboardType === DASHBOARD_TYPE_MAIN &&
		analyticsGoalsData?.items?.length > 0
			? [
					{
						id: 'goals',
						stat: 3,
						title: __( 'Goals', 'google-site-kit' ),
						datapoint: analyticsGoalsDatapoint,
						change: analyticsGoalsChange,
						isGatheringData: isAnalyticsGatheringData,
					},
			  ]
			: [] ),
		...( showAnalytics && dashboardType === DASHBOARD_TYPE_ENTITY
			? [
					{
						id: 'bounce',
						stat: 4,
						title: __( 'Bounce Rate', 'google-site-kit' ),
						datapoint: analyticsBounceDatapoint,
						datapointUnit: '%',
						change: analyticsBounceChange,
						isGatheringData: isAnalyticsGatheringData,
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
								/>
							</Cell>
						) ) }
					</Row>
				</Cell>

				<OptionalCells
					canViewSharedAnalytics={ canViewSharedAnalytics }
					error={ error }
					halfCellProps={ halfCellProps }
					quarterCellProps={ quarterCellProps }
					showAnalytics={ showAnalytics }
					showGoalsCTA={ showGoalsCTA }
					showRecoverableAnalytics={ showRecoverableAnalytics }
					WidgetReportError={ WidgetReportError }
				/>
			</Row>
		</Grid>
	);
};

Overview.propTypes = {
	analyticsData: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ),
	analyticsGoalsData: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ),
	analyticsVisitorsData: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ),
	searchConsoleData: PropTypes.arrayOf( PropTypes.object ),
	selectedStats: PropTypes.number.isRequired,
	handleStatsSelection: PropTypes.func.isRequired,
	error: PropTypes.object,
	WidgetReportError: PropTypes.elementType.isRequired,
};

export default Overview;
