/**
 * Module setup hooks types.
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
import { GATrackingEventArgs } from '@/js/types/GATrackingEventArgs';

/**
 * GA tracking event args for module setup hooks.
 *
 * Requires `category` and `action`; `label` and `value` remain optional.
 *
 * @since 1.183.0
 */
export type ModuleSetupGATrackingEventArgs = Required<
	Pick< GATrackingEventArgs, 'category' | 'action' >
> &
	Pick< GATrackingEventArgs, 'label' | 'value' >;

/**
 * Options for the `useFinishSetup` hook.
 *
 * @since 1.183.0
 */
export interface UseFinishSetupOptions {
	gaTrackingEventArgs?: ModuleSetupGATrackingEventArgs;
}

/**
 * Options for the `useModuleSetupTracking` hook.
 *
 * @since 1.183.0
 */
export interface UseModuleSetupTrackingOptions {
	viewGATrackingEventArgs?: ModuleSetupGATrackingEventArgs;
	cancelGATrackingEventArgs?: ModuleSetupGATrackingEventArgs;
}

/**
 * Callback returned by `useFinishSetup`.
 *
 * Clears the module setup cache, tracks a completion event, and redirects
 * the user to the Site Kit dashboard or an optional custom URL.
 *
 * @since 1.183.0
 */
export type FinishSetupCallback = ( redirectURL?: string ) => Promise< void >;

/**
 * Return value of the `useModuleSetupTracking` hook.
 *
 * @since 1.183.0
 */
export interface UseModuleSetupTrackingReturn {
	trackCancel: () => Promise< void >;
}
