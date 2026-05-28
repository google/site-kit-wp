/**
 * `useSiteGoalsTour` hook.
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
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { getSiteGoalsTour } from '@/js/feature-tours/site-goals';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

/**
 * Returns the Site Goals tour config picked from the user's detected
 * conversion events. When only ecommerce events are detected, step 2
 * uses the sales copy. Otherwise step 2 uses the leads copy.
 *
 * @since n.e.x.t
 *
 * @return The Site Goals tour config.
 */
export function useSiteGoalsTour() {
	const hasEcommerceConversionReportingEvents = useSelect(
		( select: Select ) =>
			select(
				MODULES_ANALYTICS_4
			).hasEcommerceConversionReportingEvents(),
		[]
	);

	const hasLeadConversionReportingEvents = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasLeadConversionReportingEvents(),
		[]
	);

	const isEcommerceOnly =
		!! hasEcommerceConversionReportingEvents &&
		! hasLeadConversionReportingEvents;

	return getSiteGoalsTour( { isEcommerceOnly } );
}
