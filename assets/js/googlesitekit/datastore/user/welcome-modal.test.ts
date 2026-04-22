/**
 * `core/user` data store, welcome modal tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { createTestRegistry } from 'tests/js/utils';
import {
	CORE_USER,
	WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
	WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
} from './constants';

describe( 'core/user welcome modal', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'selectors', () => {
		describe( 'isDataGatheringCompleteModalActive', () => {
			it( 'should return true when the gathering data variant is dismissed but the tour variant is not', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
					] );

				expect(
					registry
						.select( CORE_USER )
						.isDataGatheringCompleteModalActive()
				).toBe( true );
			} );

			it( 'should return false when the gathering data variant is not dismissed', () => {
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				expect(
					registry
						.select( CORE_USER )
						.isDataGatheringCompleteModalActive()
				).toBe( false );
			} );

			it( 'should return false when the tour variant is dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
					] );

				expect(
					registry
						.select( CORE_USER )
						.isDataGatheringCompleteModalActive()
				).toBe( false );
			} );

			it( 'should return false when both the gathering data and tour variants are dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
						WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
					] );

				expect(
					registry
						.select( CORE_USER )
						.isDataGatheringCompleteModalActive()
				).toBe( false );
			} );
		} );
	} );
} );
