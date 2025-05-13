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

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { Grid, Row } from '../../../../../../material-components';
import { trackEvent } from '../../../../../../util';
import { CORE_MODULES } from '../../../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../../../../../../hooks/useDashboardType';
import useViewOnly from '../../../../../../hooks/useViewOnly';
import useViewContext from '../../../../../../hooks/useViewContext';
import OptionalCells from './OptionalCells';
import DataBlocks from './DataBlocks';

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

	const ga4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);

	const engagementRateLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/12195621',
		} )
	);

	const showGA4 =
		canViewSharedAnalytics4 &&
		ga4ModuleConnected &&
		! error &&
		! showRecoverableAnalytics;

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
				ga4Data?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value === '0' ) );

	return (
		<Grid>
			<Row>
				<DataBlocks
					ga4Data={ ga4Data }
					ga4VisitorsData={ ga4VisitorsData }
					searchConsoleData={ searchConsoleData }
					selectedStats={ selectedStats }
					handleStatsSelection={ handleStatsSelection }
					dateRangeLength={ dateRangeLength }
					showGA4={ showGA4 }
					dashboardType={ dashboardType }
					showConversionsCTA={ showConversionsCTA }
					engagementRateLearnMoreURL={ engagementRateLearnMoreURL }
					onGA4NewBadgeLearnMoreClick={ onGA4NewBadgeLearnMoreClick }
				/>

				<OptionalCells
					canViewSharedAnalytics4={ canViewSharedAnalytics4 }
					error={ error }
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
