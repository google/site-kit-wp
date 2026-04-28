/**
 * OnlineStorePerformanceWidget component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import WidgetHeaderTitle from '@/js/googlesitekit/widgets/components/WidgetHeaderTitle';
import {
	GOAL_DRIVER_IDS,
	GOAL_TYPES,
	getPrimaryEcommerceEvent,
	GoalDriversSection,
	useGoalDriversData,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers';

// TODO: Replace hardcoded selected drivers with datastore-backed selection in #12578.
const DEFAULT_SELECTED_GOAL_DRIVER_IDS = [
	GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
	GOAL_DRIVER_IDS.TOP_PAGES,
	GOAL_DRIVER_IDS.VISITOR_TYPE,
];

export default function OnlineStorePerformanceWidget( { Widget, WidgetNull } ) {
	const hasEcommerceConversionReportingEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasEcommerceConversionReportingEvents()
	);
	const detectedEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getDetectedEvents()
	);

	const primaryEvent = getPrimaryEcommerceEvent( detectedEvents );

	const { drivers, hasExpandableRows } = useGoalDriversData( {
		goalType: GOAL_TYPES.ECOMMERCE,
		primaryEvent,
		selectedDriverIDs: DEFAULT_SELECTED_GOAL_DRIVER_IDS,
	} );

	if ( ! hasEcommerceConversionReportingEvents ) {
		return <WidgetNull />;
	}

	return (
		<Widget>
			<WidgetHeaderTitle
				title={ __( 'Online store performance', 'google-site-kit' ) }
			/>
			<GoalDriversSection
				drivers={ drivers }
				hasExpandableRows={ hasExpandableRows }
				goalType={ GOAL_TYPES.ECOMMERCE }
			/>
		</Widget>
	);
}

OnlineStorePerformanceWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};
