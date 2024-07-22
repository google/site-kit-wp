/**
 * `useGlobalTrackingEffect` hook.
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
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import useViewContext from './useViewContext';
import { deleteItem, getItem } from '../googlesitekit/api/cache';
import { trackEvent } from '../util';

/**
 * Tracks the successful user and site setup.
 *
 * @since n.e.x.t
 */
export const useGlobalTrackingEffect = () => {
	const viewContext = useViewContext();

	const isUsingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const setupErrorMessage = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorMessage()
	);

	useEffect( () => {
		const trackEvents = async () => {
			const startUserSetup = await getItem( 'start_user_setup' );
			const startSiteSetup = await getItem( 'start_site_setup' );

			if ( startUserSetup?.value !== undefined ) {
				await deleteItem( 'start_user_setup' );
				trackEvent(
					`${ viewContext }_setup`,
					'complete_user_setup',
					isUsingProxy ? 'proxy' : 'custom-oauth'
				);
			}

			if ( startSiteSetup?.value !== undefined ) {
				await deleteItem( 'start_site_setup' );
				trackEvent(
					`${ viewContext }_setup`,
					'complete_site_setup',
					isUsingProxy ? 'proxy' : 'custom-oauth'
				);
			}
		};

		if ( ! setupErrorMessage && isUsingProxy !== undefined ) {
			trackEvents();
		}
	}, [ viewContext, isUsingProxy, setupErrorMessage ] );
};
