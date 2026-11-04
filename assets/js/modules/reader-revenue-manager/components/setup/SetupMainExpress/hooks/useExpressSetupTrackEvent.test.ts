/**
 * Reader Revenue Manager express setup `useExpressSetupTrackEvent` hook tests.
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
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import useExpressSetupTrackEvent from './useExpressSetupTrackEvent';

describe( 'useExpressSetupTrackEvent', () => {
	mockLocation();

	let mockTrackEvent: jest.SpyInstance;

	beforeEach( () => {
		mockTrackEvent = jest
			.spyOn( tracking, 'trackEvent' )
			.mockImplementation( () => Promise.resolve() );
	} );

	afterEach( () => {
		mockTrackEvent.mockRestore();
	} );

	it( 'should track the event with the category for the CTA being set up', async () => {
		global.location.href = 'http://example.com/?cta=newsletter-signup';

		const { result } = renderHook( () => useExpressSetupTrackEvent(), {
			registry: createTestRegistry(),
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		await result.current( 'start_step', 'terms-of-service' );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'moduleSetup_rrm-express-setup_newsletter-signup',
			'start_step',
			'terms-of-service'
		);
	} );

	it( 'should not track the event outside a CTA setup flow', async () => {
		global.location.href = 'http://example.com/';

		const { result } = renderHook( () => useExpressSetupTrackEvent(), {
			registry: createTestRegistry(),
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		await expect(
			result.current( 'start_step', 'terms-of-service' )
		).resolves.toBeUndefined();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );
} );
