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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from '../constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';

/**
 * Determines whether the CTA widget should be displayed.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether the CTA widget should be displayed.
 */
export default function useDisplayCTAWidget() {
	return useSelect( ( select ) => {
		const isDismissed = select( CORE_USER ).isItemDismissed(
			KEY_METRICS_SETUP_CTA_WIDGET_SLUG
		);

		// We call isGatheringData() within this hook for completeness as we do not want to rely
		// on it being called in other components. This selector makes report requests which, if they return
		// data, then the `data-available` transients are set. These transients are prefetched as a global on
		// the next page load.

		const searchConsoleDataAvailableOnLoad = isModuleDataAvailableOnLoad(
			select,
			'search-console',
			MODULES_SEARCH_CONSOLE
		);
		const analyticsDataAvailableOnLoad = isModuleDataAvailableOnLoad(
			select,
			'analytics-4',
			MODULES_ANALYTICS_4
		);

		return (
			isDismissed === false &&
			searchConsoleDataAvailableOnLoad &&
			analyticsDataAvailableOnLoad
		);
	}, [] );
}

function isModuleDataAvailableOnLoad( select, slug, storeName ) {
	if ( select( CORE_MODULES ).isModuleConnected( slug ) ) {
		const { isGatheringData, isDataAvailableOnLoad } = select( storeName );
		isGatheringData();
		return isDataAvailableOnLoad();
	}
}
