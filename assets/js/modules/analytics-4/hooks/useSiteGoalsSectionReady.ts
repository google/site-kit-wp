/**
 * Hook to wait for the Site Goals section to load.
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
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import {
	CORE_UI,
	FORCED_IN_VIEW_WIDGET_AREAS,
} from '@/js/googlesitekit/datastore/ui/constants';
import {
	SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS,
	waitForSiteGoalsSectionReady,
} from '@/js/modules/analytics-4/components/site-goals/feature-tours/site-goals';

/**
 * Waits for the Site Goals section to load and stop moving.
 *
 * While `enabled` is `true`, the hook tells the widget areas above and
 * including the Site Goals section to load their data, so the page reaches
 * its full height before the tour starts. It returns `true` once those areas
 * finish loading and the target the tour points to stops moving, after at
 * most 30 seconds. When `enabled` turns `false`, or the component unmounts,
 * the hook stops loading those areas. The widgets keep the data they already
 * fetched, because an area stays loaded once it has come into view.
 *
 * @since n.e.x.t
 *
 * @param enabled Whether to load the widget areas and wait. While `false`, the hook reports the section as not ready.
 * @return Whether the Site Goals section is ready.
 */
export function useSiteGoalsSectionReady( enabled: boolean ): boolean {
	const [ isSectionReady, setIsSectionReady ] = useState( false );

	const { setValue } = useDispatch( CORE_UI );

	useEffect( () => {
		if ( ! enabled ) {
			setIsSectionReady( false );
			return undefined;
		}

		setValue(
			FORCED_IN_VIEW_WIDGET_AREAS,
			SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS
		);

		const abortController = new AbortController();

		( async () => {
			const isReady = await waitForSiteGoalsSectionReady(
				abortController.signal
			);

			if ( isReady ) {
				setIsSectionReady( true );
			}
		} )();

		return () => {
			abortController.abort();
			// When the user clicks "Show me", the tour sets its own list to
			// load right after this cleanup runs.
			setValue( FORCED_IN_VIEW_WIDGET_AREAS, undefined );
		};
	}, [ enabled, setValue ] );

	return isSectionReady;
}
