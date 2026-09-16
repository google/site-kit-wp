/**
 * `useModuleSetupTracking` hook.
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { trackEvent } from '@/js/util';
import {
	ModuleSetupGATrackingEventArgs,
	UseModuleSetupTrackingOptions,
	UseModuleSetupTrackingReturn,
} from './types';

/**
 * Tracks module setup view and cancel events.
 *
 * Fires a view event on mount. Returns a `trackCancel` callback for setup
 * cancellation tracking.
 *
 * @since 1.183.0
 *
 * @param moduleSlug                        Module slug.
 * @param options                           Hook options.
 * @param options.viewGATrackingEventArgs   Optional. GA tracking event args for setup view. Defaults to the standard `view_module_setup` event for the module slug.
 * @param options.cancelGATrackingEventArgs Optional. GA tracking event args for setup cancel. Defaults to the standard `cancel_module_setup` event for the module slug.
 * @return Object with a callback to track setup cancellation.
 */
export default function useModuleSetupTracking(
	moduleSlug: string,
	{
		viewGATrackingEventArgs,
		cancelGATrackingEventArgs,
	}: UseModuleSetupTrackingOptions = {}
): UseModuleSetupTrackingReturn {
	const defaultViewGATrackingEventArgs: ModuleSetupGATrackingEventArgs = {
		category: 'moduleSetup',
		action: 'view_module_setup',
		label: moduleSlug,
	};

	const defaultCancelGATrackingEventArgs: ModuleSetupGATrackingEventArgs = {
		category: 'moduleSetup',
		action: 'cancel_module_setup',
		label: moduleSlug,
	};

	const resolvedViewGATrackingEventArgs: ModuleSetupGATrackingEventArgs =
		viewGATrackingEventArgs ?? defaultViewGATrackingEventArgs;

	const resolvedCancelGATrackingEventArgs: ModuleSetupGATrackingEventArgs =
		cancelGATrackingEventArgs ?? defaultCancelGATrackingEventArgs;

	useMount( () => {
		const { category, action, label, value } =
			resolvedViewGATrackingEventArgs;

		trackEvent( category, action, label, value );
	} );

	const { category, action, label, value } =
		resolvedCancelGATrackingEventArgs;

	const trackCancel = useCallback( async () => {
		await trackEvent( category, action, label, value );
	}, [ category, action, label, value ] );

	return { trackCancel };
}
