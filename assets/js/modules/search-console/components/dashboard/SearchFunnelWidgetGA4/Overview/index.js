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
import { Grid, Row } from '@/js/material-components';
import { trackEvent } from '@/js/util';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '@/js/hooks/useDashboardType';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import useViewContext from '@/js/hooks/useViewContext';
import OptionalCells from './OptionalCells';
import DataBlocks from './DataBlocks';

export default function Overview( props ) {
	const {
		ga4Data,
		ga4KeyEventsData,
		ga4VisitorsData,
		searchConsoleData,
		selectedStats,
		handleStatsSelection,
		dateRangeLength,
		errors,
		WidgetReportError,
		showRecoverableAnalytics,
	} = props;

	const dashboardType = useDashboardType();

	const viewOnly = useViewOnly();
	const viewContext = useViewContext();

	const isAnalytics4ModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( MODULE_SLUG_ANALYTICS_4 )
	);

	const canViewSharedAnalytics4 = useSelect( ( select ) => {
		if ( ! isAnalytics4ModuleAvailable ) {
			return false;
		}

		if ( ! viewOnly ) {
			return true;
		}

		return select( CORE_USER ).canViewSharedModule(
			MODULE_SLUG_ANALYTICS_4
		);
	} );

	const ga4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
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
		! errors.length &&
		! showRecoverableAnalytics;

	const onGA4NewBadgeLearnMoreClick = useCallback( () => {
		trackEvent( `${ viewContext }_ga4-new-badge`, 'click_learn_more_link' );
	}, [ viewContext ] );

	const showKeyEventsCTA =
		isAuthenticated &&
		showGA4 &&
		dashboardType === DASHBOARD_TYPE_MAIN &&
		( ! ga4KeyEventsData?.length ||
			// Show the CTA if the sole key event set up is the
			// GA4 default "purchase" key event event with no data value.
			( ga4KeyEventsData?.length === 1 &&
				ga4KeyEventsData[ 0 ].eventName === 'purchase' &&
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
					showKeyEventsCTA={ showKeyEventsCTA }
					engagementRateLearnMoreURL={ engagementRateLearnMoreURL }
					onGA4NewBadgeLearnMoreClick={ onGA4NewBadgeLearnMoreClick }
				/>

				<OptionalCells
					canViewSharedAnalytics4={ canViewSharedAnalytics4 }
					errors={ errors }
					showGA4={ showGA4 }
					showKeyEventsCTA={ showKeyEventsCTA }
					showRecoverableAnalytics={ showRecoverableAnalytics }
					WidgetReportError={ WidgetReportError }
				/>
			</Row>
		</Grid>
	);
}

Overview.propTypes = {
	ga4Data: PropTypes.object,
	ga4KeyEventsData: PropTypes.arrayOf( PropTypes.object ),
	ga4VisitorsData: PropTypes.object,
	searchConsoleData: PropTypes.arrayOf( PropTypes.object ),
	selectedStats: PropTypes.number.isRequired,
	handleStatsSelection: PropTypes.func.isRequired,
	errors: PropTypes.arrayOf( PropTypes.object ),
	WidgetReportError: PropTypes.elementType.isRequired,
};
