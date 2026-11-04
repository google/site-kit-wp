/**
 * Consume pending setup hook tests.
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
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import * as pendingSetup from '@/js/googlesitekit/feature-discovery/pending-setup';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import useConsumePendingSetup from './useConsumePendingSetup';

const consumePendingSetupSpy = jest.spyOn(
	pendingSetup,
	'consumePendingSetup'
);

describe( 'useConsumePendingSetup', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		consumePendingSetupSpy.mockReset();
	} );

	it( 'should consume the record exactly once per mount and store the result', async () => {
		const record = { featureSlug: 'adsense', returnTab: '/whats-new' };
		consumePendingSetupSpy.mockResolvedValue( record );

		const { result, rerender, waitForNextUpdate } = renderHook(
			() => useConsumePendingSetup(),
			{ registry }
		);

		expect( result.current ).toBe( false );

		await waitForNextUpdate?.();

		expect( result.current ).toBe( true );

		rerender();

		expect( consumePendingSetupSpy ).toHaveBeenCalledTimes( 1 );
		expect(
			registry.select( CORE_FEATURE_DISCOVERY ).getPendingSetup()
		).toEqual( record );
	} );

	it( 'should still finish, with no record stored, when reading the record fails', async () => {
		consumePendingSetupSpy.mockRejectedValue( new Error( 'Bad record' ) );

		const { result, waitForNextUpdate } = renderHook(
			() => useConsumePendingSetup(),
			{ registry }
		);

		await waitForNextUpdate?.();

		expect( result.current ).toBe( true );
		expect(
			registry.select( CORE_FEATURE_DISCOVERY ).getPendingSetup()
		).toBeNull();
	} );
} );
