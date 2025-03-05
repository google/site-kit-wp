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
import { _x } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { isURL } from '@wordpress/url';

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
import { isZeroReport } from '../../../utils';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { Grid, Row, Cell } from '../../../../../material-components/layout';
import { DAY_IN_SECONDS, getURLPath } from '../../../../../util';
import whenActive from '../../../../../util/when-active';
import SourceLink from '../../../../../components/SourceLink';
import TotalUserCount from './TotalUserCount';
import UserCountGraph from './UserCountGraph';
import DimensionTabs from './DimensionTabs';
import UserDimensionsPieChart from './UserDimensionsPieChart';
import useViewOnly from '../../../../../hooks/useViewOnly';
import SurveyViewTrigger from '../../../../../components/surveys/SurveyViewTrigger';

function DashboardAllTrafficWidgetGA4( props ) {
	const { Widget, WidgetReportError } = props;

	const viewOnly = useViewOnly();

	const canViewSharedAnalytics4 = useSelect( ( select ) => {
		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule( 'analytics-4' );
	} );

	const isGatheringData = useInViewSelect(
		( select ) =>
			canViewSharedAnalytics4 &&
			select( MODULES_ANALYTICS_4 ).isGatheringData()
	);
	const gatheringDataLoaded = isGatheringData !== undefined;

	const [ firstLoad, setFirstLoad ] = useState( true );
	const [ currentRange, setCurrentRange ] = useState( '' );

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
	const entityURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const { startDate, endDate, compareStartDate, compareEndDate } = useSelect(
		( select ) =>
			select( CORE_USER ).getDateRangeDates( {
				compare: true,
				offsetDays: DATE_RANGE_OFFSET,
			} )
	);

	const baseArgs = {
		startDate,
		endDate,
		metrics: [ { name: 'totalUsers' } ],
	};

	const pieArgs = {
		...baseArgs,
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
		...baseArgs,
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
		...baseArgs,
		compareStartDate,
		compareEndDate,
	};

	if ( entityURL ) {
		pieArgs.url = entityURL;
		graphArgs.url = entityURL;
		totalsArgs.url = entityURL;
	}

	if ( dimensionName && dimensionValue ) {
		graphArgs.dimensionFilters = { [ dimensionName ]: dimensionValue };
		totalsArgs.dimensionFilters = { [ dimensionName ]: dimensionValue };
	}

	const pieChartLoaded = useSelect(
		( select ) =>
			canViewSharedAnalytics4 &&
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				pieArgs,
			] )
	);
	const pieChartError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			pieArgs,
		] )
	);
	const pieChartReport = useInViewSelect(
		( select ) => {
			return (
				canViewSharedAnalytics4 &&
				select( MODULES_ANALYTICS_4 ).getReport( pieArgs )
			);
		},
		[ canViewSharedAnalytics4, pieArgs ]
	);

	const userCountGraphLoaded = useSelect(
		( select ) =>
			canViewSharedAnalytics4 &&
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				graphArgs,
			] )
	);
	const userCountGraphError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			graphArgs,
		] )
	);
	const userCountGraphReport = useInViewSelect(
		( select ) => {
			return (
				canViewSharedAnalytics4 &&
				select( MODULES_ANALYTICS_4 ).getReport( graphArgs )
			);
		},
		[ canViewSharedAnalytics4, graphArgs ]
	);

	const totalUsersLoaded = useSelect(
		( select ) =>
			canViewSharedAnalytics4 &&
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				totalsArgs,
			] )
	);
	const totalUsersError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			totalsArgs,
		] )
	);
	const totalUsersReport = useInViewSelect(
		( select ) => {
			return (
				canViewSharedAnalytics4 &&
				select( MODULES_ANALYTICS_4 ).getReport( totalsArgs )
			);
		},
		[ canViewSharedAnalytics4, totalsArgs ]
	);

	const reportArgs = {
		dates: {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		},
	};

	let reportType;
	switch ( dimensionName ) {
		case 'country':
			reportType = 'user-demographics-detail';
			reportArgs.details = {
				metric: 'activeUsers',
				dimension: 'country',
			};
			// eslint-disable-next-line sitekit/acronym-case
			reportArgs.otherArgs = { collectionId: 'user' };
			break;
		case 'deviceCategory':
			reportType = 'user-technology-detail';
			reportArgs.details = {
				metric: 'activeUsers',
				dimension: 'deviceCategory',
			};
			// eslint-disable-next-line sitekit/acronym-case
			reportArgs.otherArgs = { collectionId: 'user' };
			break;
		case 'sessionDefaultChannelGrouping':
		default:
			reportType = 'lifecycle-traffic-acquisition-v2';
			// eslint-disable-next-line sitekit/acronym-case
			reportArgs.otherArgs = { collectionId: 'life-cycle' };
			break;
	}

	if ( isURL( entityURL ) ) {
		reportArgs.filters = {
			unifiedPagePathScreen: getURLPath( entityURL ),
		};
	}

	const serviceReportURL = useSelect( ( select ) => {
		if ( viewOnly ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
			reportType,
			reportArgs
		);
	} );

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
	const { setValue } = useDispatch( CORE_UI );
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

	return (
		<Widget
			className="googlesitekit-widget--footer-v2 googlesitekit-widget__analytics--all-traffic"
			Footer={ () => (
				<SourceLink
					className="googlesitekit-data-block__source"
					name={ _x(
						'Analytics',
						'Service name',
						'google-site-kit'
					) }
					href={ serviceReportURL }
					external
				/>
			) }
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

export default whenActive( { moduleName: 'analytics-4' } )(
	DashboardAllTrafficWidgetGA4
);
