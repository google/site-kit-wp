/**
 * `useFinishSetup` hook.
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
import { useCallbackOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { type Registry, useDispatch, useRegistry } from 'googlesitekit-data';
import { deleteItem } from '@/js/googlesitekit/api/cache';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useForwardableParams from '@/js/hooks/useForwardableParams';
import { trackEvent } from '@/js/util';
import {
	FinishSetupCallback,
	ModuleSetupGATrackingEventArgs,
	UseFinishSetupOptions,
} from './types';

/**
 * Returns a callback to complete module setup.
 *
 * Clears the module setup cache, tracks a completion event, and redirects
 * the user to the Site Kit dashboard or an optional custom URL.
 *
 * @since 1.183.0
 *
 * @param moduleSlug                  Module slug.
 * @param options                     Hook options.
 * @param options.gaTrackingEventArgs Optional. GA tracking event args. Defaults to the standard `complete_module_setup` event for the module slug.
 * @return Async callback to finish module setup.
 */
export default function useFinishSetup(
	moduleSlug: string,
	{ gaTrackingEventArgs }: UseFinishSetupOptions = {}
): FinishSetupCallback {
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const forwardableParams = useForwardableParams();

	// `@wordpress/data` types `useRegistry()` as returning `Function`, which
	// does not overlap with `Registry`. Casting through `unknown` tells
	// TypeScript to treat the runtime registry object as Site Kit's registry
	// shape instead.
	const registry = useRegistry() as unknown as Registry;

	const defaultGATrackingEventArgs: ModuleSetupGATrackingEventArgs = {
		category: 'moduleSetup',
		action: 'complete_module_setup',
		label: moduleSlug,
	};

	const { category, action, label, value } =
		gaTrackingEventArgs ?? defaultGATrackingEventArgs;

	return useCallbackOne(
		async ( redirectURL?: string ) => {
			await deleteItem( 'module_setup' );

			await trackEvent( category, action, label, value );

			if ( redirectURL ) {
				navigateTo(
					addQueryArgs( redirectURL, {
						...forwardableParams,
						...getQueryArgs( redirectURL ),
					} )
				);
				return;
			}

			const { select, resolveSelect } = registry;
			await resolveSelect( CORE_SITE ).getSiteInfo();
			const adminURL = select( CORE_SITE ).getAdminURL(
				'googlesitekit-dashboard',
				{
					...forwardableParams,
					notification: 'authentication_success',
					slug: moduleSlug,
				}
			);
			navigateTo( adminURL );
		},
		[
			category,
			action,
			label,
			value,
			forwardableParams,
			registry,
			navigateTo,
			moduleSlug,
		]
	);
}
