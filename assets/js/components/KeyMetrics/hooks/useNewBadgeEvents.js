/**
 * UseNewBadgeEvents hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	CONVERSION_REPORTING_LEAD_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';

/**
 * Returns the list of conversion events for which the "New" badge should be shown.
 *
 * Mirrors the logic previously in ChipTabGroup for computing `newBadgeEvents`.
 *
 * @since 1.163.0
 *
 * @return {Array<string>} List of events for which to show the "New" badge.
 */
export default function useNewBadgeEvents() {
	return useSelect( ( select ) => {
		const isGA4Connected = select( CORE_MODULES ).isModuleConnected(
			MODULE_SLUG_ANALYTICS_4
		);
		if ( ! isGA4Connected ) {
			return [];
		}

		const detectedEvents =
			select( MODULES_ANALYTICS_4 ).getDetectedEvents();
		const badgeEvents = select( MODULES_ANALYTICS_4 ).getNewBadgeEvents();

		if ( detectedEvents?.length && badgeEvents?.length ) {
			const detectedLeadEvents = detectedEvents.filter( ( event ) =>
				CONVERSION_REPORTING_LEAD_EVENTS.includes( event )
			);
			const newLeadEvents = badgeEvents.filter( ( event ) =>
				CONVERSION_REPORTING_LEAD_EVENTS.includes( event )
			);
			const newNonLeadEvents = badgeEvents.filter(
				( event ) =>
					! CONVERSION_REPORTING_LEAD_EVENTS.includes( event )
			);

			if ( detectedLeadEvents?.length > 1 && newLeadEvents.length > 0 ) {
				return newNonLeadEvents;
			}
		}

		return badgeEvents;
	} );
}
