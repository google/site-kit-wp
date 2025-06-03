/**
 * DashboardAllTrafficWidgetGA4 component
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useInViewSelect } from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
	UI_DIMENSION_NAME,
	UI_DIMENSION_VALUE,
	UI_ALL_TRAFFIC_LOADED,
} from '../../../datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../../constants';
import { DAY_IN_SECONDS } from '../../../../../util';
import { isZeroReport } from '../../../utils';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { Grid, Row, Cell } from '../../../../../material-components/layout';
import whenActive from '../../../../../util/when-active';
import DataSourceLink from './DataSourceLink';
import TotalUserCount from './TotalUserCount';
import UserCountGraph from './UserCountGraph';
import DimensionTabs from './DimensionTabs';
import UserDimensionsPieChart from './UserDimensionsPieChart';
import useAllTrafficWidgetReport from '../../../hooks/useAllTrafficWidgetReport';
import useViewOnly from '../../../../../hooks/useViewOnly';
import SurveyViewTrigger from '../../../../../components/surveys/SurveyViewTrigger';

function DashboardAllTrafficWidgetGA4( props ) {
	const { Widget, WidgetReportError } = props;

	const viewOnly = useViewOnly();

	const [ firstLoad, setFirstLoad ] = useState( true );
	const [ currentRange, setCurrentRange ] = useState( '' );

	const canViewSharedAnalytics4 = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule(
			MODULE_SLUG_ANALYTICS_4
		);
	} );

	const isGatheringData = useInViewSelect(
		( select ) =>
			canViewSharedAnalytics4 &&
			select( MODULES_ANALYTICS_4 ).isGatheringData()
	);

	const dateRange = useSelect( ( select ) =>
		select( CORE_USER ).getDateRange()
	);

	const dimensionName = useSelect(
		( select ) =>
			select( CORE_UI ).getValue( UI_DIMENSION_NAME ) ||
			'sessionDefaultChannelGrouping'
	);

	const dimensionValue = useSelect( ( select ) =>
		select( CORE_UI ).getValue( UI_DIMENSION_VALUE )
	);

	const { compareStartDate, compareEndDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const { setValue } = useDispatch( CORE_UI );

	const pieArgs = {
		compareStartDate,
		compareEndDate,
		dimensions: [ dimensionName ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
	};

	const graphArgs = {
		dimensions: [ 'date' ],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
	};

	const totalsArgs = {
		compareStartDate,
		compareEndDate,
	};

	if ( dimensionName && dimensionValue ) {
		graphArgs.dimensionFilters = { [ dimensionName ]: dimensionValue };
		totalsArgs.dimensionFilters = { [ dimensionName ]: dimensionValue };
	}

	const {
		loaded: pieChartLoaded,
		error: pieChartError,
		report: pieChartReport,
	} = useAllTrafficWidgetReport( pieArgs );

	const {
		loaded: userCountGraphLoaded,
		error: userCountGraphError,
		report: userCountGraphReport,
	} = useAllTrafficWidgetReport( graphArgs );

	const {
		loaded: totalUsersLoaded,
		error: totalUsersError,
		report: totalUsersReport,
	} = useAllTrafficWidgetReport( totalsArgs );

	useEffect( () => {
		if ( dateRange !== currentRange ) {
			setFirstLoad( true );
			setCurrentRange( dateRange );
		} else if (
			pieChartLoaded &&
			totalUsersLoaded &&
			userCountGraphLoaded
		) {
			setFirstLoad( false );
		}
	}, [
		pieChartLoaded,
		totalUsersLoaded,
		userCountGraphLoaded,
		dateRange,
		currentRange,
	] );

	// Set a flag in the core/ui store when all data is loaded.
	// Currently only used by the feature tour to delay showing
	// while the widget is in a loading state.
	useEffect( () => {
		if (
			firstLoad &&
			pieChartLoaded &&
			totalUsersLoaded &&
			userCountGraphLoaded
		) {
			setValue( UI_ALL_TRAFFIC_LOADED, true );
		}
	}, [
		firstLoad,
		pieChartLoaded,
		totalUsersLoaded,
		userCountGraphLoaded,
		setValue,
	] );

	// The User Dimensions Pie Chart uses the sample report to check
	// for zero data, so we need to retry the sample report to make
	// sure the pie chart reloads correctly.
	const sampleReportError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			select( MODULES_ANALYTICS_4 ).getSampleReportArgs(),
		] )
	);

	const retryableErrors = [
		pieChartError,
		sampleReportError,
		totalUsersError,
		userCountGraphError,
	].filter( Boolean );

	if ( pieChartError || totalUsersError || userCountGraphError ) {
		return (
			<Widget>
				<WidgetReportError
					moduleSlug="analytics-4"
					error={ retryableErrors }
				/>
			</Widget>
		);
	}

	const pieChartReportIsZero = isZeroReport( pieChartReport );

	const gatheringDataLoaded = isGatheringData !== undefined;

	return (
		<Widget
			className="googlesitekit-widget--footer-v2 googlesitekit-widget__analytics--all-traffic"
			Footer={ () => <DataSourceLink /> }
			noPadding
		>
			<Grid>
				<Row>
					<Cell
						className="googlesitekit-widget--analyticsAllTraffic__totals"
						lgSize={ 7 }
						mdSize={ 8 }
					>
						<TotalUserCount
							loaded={
								gatheringDataLoaded &&
								totalUsersLoaded &&
								! firstLoad
							}
							report={ totalUsersReport }
							error={ totalUsersError }
							dimensionValue={ dimensionValue }
							gatheringData={ isGatheringData }
						/>

						<UserCountGraph
							loaded={
								gatheringDataLoaded &&
								userCountGraphLoaded &&
								! firstLoad
							}
							error={ userCountGraphError }
							report={ userCountGraphReport }
							gatheringData={ isGatheringData }
						/>
					</Cell>

					<Cell
						className="googlesitekit-widget--analyticsAllTraffic__dimensions"
						lgSize={ 5 }
						mdSize={ 8 }
					>
						<DimensionTabs
							loaded={ gatheringDataLoaded && ! firstLoad }
							dimensionName={ dimensionName }
							gatheringData={ isGatheringData }
							isZeroData={ pieChartReportIsZero }
						/>
						<UserDimensionsPieChart
							dimensionName={ dimensionName }
							dimensionValue={ dimensionValue }
							gatheringData={ isGatheringData }
							loaded={
								gatheringDataLoaded &&
								pieChartLoaded &&
								! firstLoad
							}
							report={ pieChartReport }
						/>
					</Cell>
				</Row>
			</Grid>

			{ ! viewOnly && (
				<SurveyViewTrigger
					triggerID="view_ga4_dashboard"
					ttl={ DAY_IN_SECONDS }
				/>
			) }
		</Widget>
	);
}

export default whenActive( { moduleName: MODULE_SLUG_ANALYTICS_4 } )(
	DashboardAllTrafficWidgetGA4
);
