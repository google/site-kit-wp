/**
 * ModulePopularPagesWidgetGA4 `useChangeContentTab` hook.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import useViewContext from '@/js/hooks/useViewContext';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { trackEvent } from '@/js/util';

/**
 * Returns a function that selects a tab of the content card, and tracks the
 * change as a `change_tab` event labelled with the tab's ID.
 *
 * The function does nothing for the tab that is active already. So a click on
 * that tab sends no event, and neither does a click on "See all recent posts"
 * while Latest content is active.
 *
 * @since n.e.x.t
 *
 * @return {Function} The function that selects a tab by its ID.
 */
export function useChangeContentTab(): ( tabID: string ) => void {
	const viewContext = useViewContext();

	const activeTabID = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getActiveContentTab(),
		[]
	);

	const { setActiveContentTab } = useDispatch( MODULES_ANALYTICS_4 );

	return useCallback(
		( tabID: string ) => {
			if ( tabID === activeTabID ) {
				return;
			}

			trackEvent( `${ viewContext }_content-tabs`, 'change_tab', tabID );
			setActiveContentTab( tabID );
		},
		[ activeTabID, setActiveContentTab, viewContext ]
	);
}
