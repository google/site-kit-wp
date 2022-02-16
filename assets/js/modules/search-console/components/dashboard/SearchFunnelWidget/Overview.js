/**
 * Overview component for SearchFunnelWidget.
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
import { useContext, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Grid, Row, Cell } from '../../../../../material-components';
import {
	VIEW_CONTEXT_DASHBOARD,
	VIEW_CONTEXT_PAGE_DASHBOARD,
} from '../../../../../googlesitekit/constants';
import { extractSearchConsoleDashboardData } from '../../../util';
import { calculateChange } from '../../../../../util';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../datastore/constants';
import { useFeature } from '../../../../../hooks/useFeature';
import CompleteModuleActivationCTA from '../../../../../components/CompleteModuleActivationCTA';
import ActivateModuleCTA from '../../../../../components/ActivateModuleCTA';
import ActivateAnalyticsCTA from './ActivateAnalyticsCTA';
import CreateGoalCTA from './CreateGoalCTA';
import CTA from '../../../../../components/notifications/CTA';
import ViewContextContext from '../../../../../components/Root/ViewContextContext';
import DataBlock from '../../../../../components/DataBlock';
import ProgressBar from '../../../../../components/ProgressBar';
import ReportZero from '../../../../../components/ReportZero';
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
} ) => {
	const viewContext = useContext( ViewContextContext );
	const zeroDataStatesEnabled = useFeature( 'zeroDataStates' );

	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);
	const analyticsModuleActiveAndConnected =
		analyticsModuleActive && analyticsModuleConnected;

	const adminReauthURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAdminReauthURL()
	);
	const isNavigatingToReauthURL = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigatingTo( adminReauthURL )
	);
	const isAnalyticsGatheringData = useInViewSelect( ( select ) =>
		analyticsModuleActiveAndConnected
			? select( MODULES_ANALYTICS ).isGatheringData()
			: false
	);
	const isSearchConsoleGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
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

	const quarterCellProps = {
		smSize: 2,
		mdSize: 2,
		lgSize: 3,
	};

	const halfCellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 6,
	};

	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/1032415',
			hash: 'create_or_edit_goals',
		} )
	);

	return (
		<Grid>
			<Row>
				<Cell { ...quarterCellProps }>
					<DataBlock
						stat={ 0 }
						className="googlesitekit-data-block--impressions googlesitekit-data-block--button-1"
						title={ __( 'Total Impressions', 'google-site-kit' ) }
						datapoint={ totalImpressions }
						change={ totalImpressionsChange }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 0 }
						handleStatSelection={ handleStatsSelection }
						gatheringData={ isSearchConsoleGatheringData }
					/>
				</Cell>

				<Cell { ...quarterCellProps }>
					<DataBlock
						stat={ 1 }
						className="googlesitekit-data-block--clicks googlesitekit-data-block--button-2"
						title={ __( 'Total Clicks', 'google-site-kit' ) }
						datapoint={ totalClicks }
						change={ totalClicksChange }
						changeDataUnit="%"
						context="button"
						selected={ selectedStats === 1 }
						handleStatSelection={ handleStatsSelection }
						gatheringData={ isSearchConsoleGatheringData }
					/>
				</Cell>

				{ isNavigatingToReauthURL && (
					<Cell
						{ ...halfCellProps }
						className="googlesitekit-data-block__loading"
					>
						<ProgressBar />
					</Cell>
				) }

				{ ( ! analyticsModuleConnected || ! analyticsModuleActive ) &&
					! isNavigatingToReauthURL && (
						<Cell { ...halfCellProps }>
							{ ! analyticsModuleActive &&
								( zeroDataStatesEnabled ? (
									<ActivateAnalyticsCTA />
								) : (
									<ActivateModuleCTA moduleSlug="analytics" />
								) ) }

							{ analyticsModuleActive &&
								! analyticsModuleConnected && (
									<CompleteModuleActivationCTA moduleSlug="analytics" />
								) }
						</Cell>
					) }

				{ analyticsModuleActiveAndConnected && error && (
					<Cell { ...halfCellProps }>
						<WidgetReportError
							moduleSlug="analytics"
							error={ error }
						/>
					</Cell>
				) }

				{ isAnalyticsGatheringData &&
					! error &&
					! zeroDataStatesEnabled && (
						<Cell { ...halfCellProps }>
							{ /* We need to use ReportZero rather than WidgetReportZero to not associate a zero state for the whole widget. */ }
							<ReportZero moduleSlug="analytics" />
						</Cell>
					) }

				{ ( ( analyticsModuleConnected &&
					! isAnalyticsGatheringData &&
					! zeroDataStatesEnabled &&
					! error ) ||
					( analyticsModuleConnected &&
						zeroDataStatesEnabled &&
						! error ) ) && (
					<Fragment>
						<Cell { ...quarterCellProps }>
							<DataBlock
								stat={ 2 }
								className="googlesitekit-data-block--visitors googlesitekit-data-block--button-3"
								title={ __(
									'Unique Visitors from Search',
									'google-site-kit'
								) }
								datapoint={ analyticsVisitorsDatapoint }
								change={ analyticsVisitorsChange }
								changeDataUnit="%"
								context="button"
								selected={ selectedStats === 2 }
								handleStatSelection={ handleStatsSelection }
								gatheringData={ isAnalyticsGatheringData }
							/>
						</Cell>

						<Cell { ...quarterCellProps }>
							{ viewContext === VIEW_CONTEXT_DASHBOARD &&
								! analyticsGoalsData?.items?.length &&
								( zeroDataStatesEnabled ? (
									<CreateGoalCTA />
								) : (
									<CTA
										title={ __(
											'Use goals to measure success',
											'google-site-kit'
										) }
										description={ __(
											'Goals measure how well your site or app fulfills your target objectives',
											'google-site-kit'
										) }
										ctaLink={ supportURL }
										ctaLabel={ __(
											'Create a new goal',
											'google-site-kit'
										) }
										ctaLinkExternal
									/>
								) ) }
							{ viewContext === VIEW_CONTEXT_DASHBOARD &&
								analyticsGoalsData?.items?.length > 0 && (
									<DataBlock
										stat={ 3 }
										className="googlesitekit-data-block--goals googlesitekit-data-block--button-4"
										title={ __(
											'Goals',
											'google-site-kit'
										) }
										datapoint={ analyticsGoalsDatapoint }
										change={ analyticsGoalsChange }
										changeDataUnit="%"
										context="button"
										selected={ selectedStats === 3 }
										handleStatSelection={
											handleStatsSelection
										}
										gatheringData={
											isAnalyticsGatheringData
										}
									/>
								) }

							{ viewContext === VIEW_CONTEXT_PAGE_DASHBOARD && (
								<DataBlock
									stat={ 4 }
									className="googlesitekit-data-block--bounce googlesitekit-data-block--button-4"
									title={ __(
										'Bounce Rate',
										'google-site-kit'
									) }
									datapoint={ analyticsBounceDatapoint }
									datapointUnit="%"
									change={ analyticsBounceChange }
									changeDataUnit="%"
									context="button"
									selected={ selectedStats === 4 }
									handleStatSelection={ handleStatsSelection }
									gatheringData={ isAnalyticsGatheringData }
									invertChangeColor
								/>
							) }
						</Cell>
					</Fragment>
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
