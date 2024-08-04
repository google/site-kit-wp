/**
 * `modules/reader-revenue-manager` data store: settings tests.
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
import API from 'googlesitekit-api';
import { createTestRegistry } from '../../../../../tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from './constants';
import {
	INVARIANT_INVALID_PUBLICATION_ID,
	INVARIANT_INVALID_PUBLICATION_ONBOARDING_STATE,
	validateCanSubmitChanges,
} from './settings';

describe( 'modules/reader-revenue-manager settings', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'validateCanSubmitChanges', () => {
		it( 'should throw invariant error for invalid publication ID of type number', () => {
			const settings = {
				publicationID: 12345,
				publicationOnboardingState: '',
				publicationOnboardingStateLastSyncedAtMs: 0,
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PUBLICATION_ID
			);
		} );

		it( 'should throw invariant error for invalid publication ID with special chars', () => {
			const settings = {
				publicationID: 'ABCD&*12345',
				publicationOnboardingState: 'ONBOARDING_ACTION_REQUIRED',
				publicationOnboardingStateLastSyncedAtMs: 0,
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PUBLICATION_ID
			);
		} );

		it( 'should throw invariant error for invalid publication onboarding state', () => {
			const settings = {
				publicationID: 'ABCDEFGH',
				publicationOnboardingState: 'invalid_state',
				publicationOnboardingStateLastSyncedAtMs: 0,
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PUBLICATION_ONBOARDING_STATE
			);
		} );
	} );
} );
