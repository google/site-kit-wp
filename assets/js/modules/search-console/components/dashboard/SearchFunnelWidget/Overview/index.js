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
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { Grid, Row, Cell } from '../../../../../../material-components';
import ActivateAnalyticsCTA from '../ActivateAnalyticsCTA';
import CreateGoalCTA from '../CreateGoalCTA';
import DataBlock from '../../../../../../components/DataBlock';
import RecoverableModules from '../../../../../../components/RecoverableModules';
import { BREAKPOINT_SMALL } from '../../../../../../hooks/useBreakpoint';
import { useOverviewData } from './useOverviewData';

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
	const {
		analyticsModuleActive,
		analyticsModuleActiveAndConnected,
		analyticsModuleConnected,
		breakpoint,
		canViewSharedAnalytics,
		dataBlockCellProps,
		dataBlocks,
		dataBlockWrapperCellProps,
		halfCellProps,
		isNavigatingToReauthURL,
		isSearchConsoleGatheringData,
		quarterCellProps,
		showAnalytics,
		showGoalsCTA,
	} = useOverviewData( {
		analyticsData,
		analyticsGoalsData,
		analyticsVisitorsData,
		dateRangeLength,
		error,
		searchConsoleData,
		showRecoverableAnalytics,
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
									gatheringData={
										isSearchConsoleGatheringData
									}
								/>
							</Cell>
						) ) }
					</Row>
				</Cell>

				{ isNavigatingToReauthURL && (
					<Cell
						{ ...halfCellProps }
						className="googlesitekit-data-block__loading"
					>
						<ProgressBar />
					</Cell>
				) }

				{ canViewSharedAnalytics &&
					( ! analyticsModuleConnected || ! analyticsModuleActive ) &&
					! isNavigatingToReauthURL && (
						<Cell { ...halfCellProps }>
							{ BREAKPOINT_SMALL !== breakpoint && (
								<ActivateAnalyticsCTA />
							) }
						</Cell>
					) }

				{ ! showRecoverableAnalytics &&
					canViewSharedAnalytics &&
					analyticsModuleActiveAndConnected &&
					error && (
						<Cell { ...halfCellProps }>
							<WidgetReportError
								moduleSlug="analytics"
								error={ error }
							/>
						</Cell>
					) }

				{ showAnalytics && (
					<Cell { ...quarterCellProps } smSize={ 4 }>
						{ showGoalsCTA && <CreateGoalCTA /> }
					</Cell>
				) }

				{ canViewSharedAnalytics &&
					analyticsModuleActiveAndConnected &&
					showRecoverableAnalytics && (
						<Cell { ...halfCellProps }>
							<RecoverableModules
								moduleSlugs={ [ 'analytics' ] }
							/>
						</Cell>
					) }
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
