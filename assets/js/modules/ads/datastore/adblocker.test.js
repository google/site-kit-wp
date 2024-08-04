/**
 * `modules/ads` data store: adblocker tests.
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
 * Internal dependencies
 */
import { MODULES_ADS } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	muteFetch,
	provideModules,
	untilResolved,
} from '../../../../../tests/js/utils';

import { detectAnyAdblocker as mockDetectAnyAdblocker } from 'just-detect-adblock';
jest.mock( 'just-detect-adblock' );

describe( 'modules/ads adblocker', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		mockDetectAnyAdblocker.mockReset();
	} );

	describe( 'selectors', () => {
		describe( 'getAdBlockerWarningMessage', () => {
			it( 'returns undefined if ad blocker state is unresolved.', async () => {
				muteFetch( 'path:/favicon.ico' );
				expect(
					registry.select( MODULES_ADS ).getAdBlockerWarningMessage()
				).toBe( undefined );

				await untilResolved( registry, CORE_USER ).isAdBlockerActive();
			} );

			it( 'returns null if ad blocker is not active', () => {
				registry
					.dispatch( CORE_USER )
					.receiveIsAdBlockerActive( false );

				expect(
					registry.select( MODULES_ADS ).getAdBlockerWarningMessage()
				).toBe( null );
			} );

			it( 'returns correct message if ad blocker is active and module is not connected', () => {
				provideModules( registry, [
					{
						slug: 'ads',
						active: true,
						connected: false,
					},
				] );

				registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );

				expect(
					registry.select( MODULES_ADS ).getAdBlockerWarningMessage()
				).toContain( 'to set up Ads' );
			} );

			it( 'returns correct message if ad blocker is active and module is connected', () => {
				provideModules( registry, [
					{
						slug: 'ads',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );

				expect(
					registry.select( MODULES_ADS ).getAdBlockerWarningMessage()
				).toContain( 'latest Ads data' );
			} );
		} );
	} );
} );
