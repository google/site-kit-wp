/**
 * Determines whether the CTA widget should be displayed.
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from '@/js/components/KeyMetrics/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';

/**
 * Determines whether the CTA widget should be displayed.
 *
 * @since 1.140.0
 *
 * @return {boolean} Whether the CTA widget should be displayed.
 */
export default function useDisplayCTAWidget() {
	const { setValue } = useDispatch( CORE_UI );

	const hasKeyMetricsSetupCTAWidgetAppeared = useSelect( ( select ) => {
		return select( CORE_UI ).getValue(
			'hasKeyMetricsSetupCTAWidgetAppeared'
		);
	} );

	const shouldDisplayCTAWidget = useSelect( ( select ) => {
		const isDismissed = select( CORE_USER ).isItemDismissed(
			KEY_METRICS_SETUP_CTA_WIDGET_SLUG
		);

		const isDismissingItem = select( CORE_USER ).isDismissingItem(
			KEY_METRICS_SETUP_CTA_WIDGET_SLUG
		);

		// We call isGatheringData() within this hook for completeness as we do
		// not want to rely on it being called in other components. This selector
		// makes report requests—if they return data, the `data-available`
		// transients are set.
		//
		// These transients are prefetched as a global on the next page load.
		const searchConsoleDataAvailableOnLoad = isModuleDataAvailableOnLoad(
			select,
			MODULE_SLUG_SEARCH_CONSOLE,
			MODULES_SEARCH_CONSOLE
		);
		const analyticsDataAvailableOnLoad = isModuleDataAvailableOnLoad(
			select,
			MODULE_SLUG_ANALYTICS_4,
			MODULES_ANALYTICS_4
		);

		return (
			isDismissed === false &&
			isDismissingItem === false &&
			searchConsoleDataAvailableOnLoad &&
			analyticsDataAvailableOnLoad
		);
	}, [] );

	// If the CTA widget is displayed, we should keep it visible until the page
	// is reloaded, even if the user dismisses it.
	//
	// This prevents the widget from disappearing while the user is redirected
	// to a new page after clicking on the CTA. (The widget displays a loading
	// indicator after the user clicks the CTA and "dismisses" it.)
	useEffect( () => {
		if (
			! hasKeyMetricsSetupCTAWidgetAppeared &&
			shouldDisplayCTAWidget === true
		) {
			setValue( 'hasKeyMetricsSetupCTAWidgetAppeared', true );
		}
	}, [
		hasKeyMetricsSetupCTAWidgetAppeared,
		setValue,
		shouldDisplayCTAWidget,
	] );

	return (
		hasKeyMetricsSetupCTAWidgetAppeared ||
		( ! hasKeyMetricsSetupCTAWidgetAppeared && shouldDisplayCTAWidget )
	);
}

function isModuleDataAvailableOnLoad( select, slug, storeName ) {
	if ( select( CORE_MODULES ).isModuleConnected( slug ) ) {
		const { isGatheringData, isDataAvailableOnLoad } = select( storeName );
		isGatheringData();
		return isDataAvailableOnLoad();
	}
	return false;
}
