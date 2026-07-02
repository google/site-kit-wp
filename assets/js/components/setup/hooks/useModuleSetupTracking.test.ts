/**
 * `useModuleSetupTracking` hook tests.
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
import { type Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as tracking from '@/js/util/tracking';
import { act, createTestRegistry, renderHook } from '@tests/js/test-utils';
import useModuleSetupTracking from './useModuleSetupTracking';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'useModuleSetupTracking', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		mockTrackEvent.mockClear();
	} );

	it( 'should track the standard view_module_setup event on mount', () => {
		renderHook( () => useModuleSetupTracking( MODULE_SLUG_ANALYTICS_4 ), {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'moduleSetup',
			'view_module_setup',
			MODULE_SLUG_ANALYTICS_4,
			undefined
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should track a custom view event on mount when provided', () => {
		renderHook(
			() =>
				useModuleSetupTracking( MODULE_SLUG_ANALYTICS_4, {
					viewGATrackingEventArgs: {
						category: `${ VIEW_CONTEXT_MODULE_SETUP }_setup`,
						action: 'setup_flow_v3_view_analytics_step',
					},
				} ),
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			}
		);

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MODULE_SETUP }_setup`,
			'setup_flow_v3_view_analytics_step',
			undefined,
			undefined
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should track the cancel_module_setup event when trackCancel is invoked', async () => {
		const { result } = renderHook(
			() => useModuleSetupTracking( 'test-module' ),
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			}
		);

		mockTrackEvent.mockClear();

		await act( async () => {
			await result.current.trackCancel();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'moduleSetup',
			'cancel_module_setup',
			'test-module',
			undefined
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should track a custom cancel event when provided', async () => {
		const { result } = renderHook(
			() =>
				useModuleSetupTracking( 'test-module', {
					cancelGATrackingEventArgs: {
						category: 'customCategory',
						action: 'custom_cancel_action',
						label: 'custom-label',
					},
				} ),
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			}
		);

		mockTrackEvent.mockClear();

		await act( async () => {
			await result.current.trackCancel();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'customCategory',
			'custom_cancel_action',
			'custom-label',
			undefined
		);
	} );
} );
