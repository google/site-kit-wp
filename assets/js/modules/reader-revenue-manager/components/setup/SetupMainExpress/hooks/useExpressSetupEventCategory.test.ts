/**
 * Reader Revenue Manager express setup `useExpressSetupEventCategory` hook tests.
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
import { mockLocation } from '@tests/js/mock-browser-utils';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import useExpressSetupEventCategory from './useExpressSetupEventCategory';

describe( 'useExpressSetupEventCategory', () => {
	mockLocation();

	it( 'should return the category for the CTA being set up', () => {
		global.location.href = 'http://example.com/?cta=newsletter-signup';

		const { result } = renderHook( () => useExpressSetupEventCategory(), {
			registry: createTestRegistry(),
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( result.current ).toBe(
			'moduleSetup_rrm-express-setup_newsletter-signup'
		);
	} );

	it( 'should return undefined outside a CTA setup flow', () => {
		global.location.href = 'http://example.com/';

		const { result } = renderHook( () => useExpressSetupEventCategory(), {
			registry: createTestRegistry(),
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( result.current ).toBeUndefined();
	} );

	it( 'should return undefined for an unknown CTA', () => {
		global.location.href = 'http://example.com/?cta=unknown-cta';

		const { result } = renderHook( () => useExpressSetupEventCategory(), {
			registry: createTestRegistry(),
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( result.current ).toBeUndefined();
	} );
} );
