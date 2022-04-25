/**
 * `googlesitekit/modules` datastore: sharing settings tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_MODULES } from './constants';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'core/modules sharing-settings', () => {
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_MODULES ].store;
	} );

	describe( 'actions', () => {
		const settings = {
			sharingSettings: {
				'search-console': {
					sharedRoles: [ 'editor', 'subscriber' ],
					management: 'all_admins',
				},
				analytics: {
					sharedRoles: [ 'editor' ],
					management: 'owner',
				},
				'pagespeed-insights': {
					sharedRoles: [ 'editor' ],
					management: 'all_admins',
				},
			},
		};

		const sharingSettingsWithOwnerID = Object.keys(
			settings.sharingSettings
		).reduce(
			( modules, moduleSlug ) => ( {
				...modules,
				[ moduleSlug ]: {
					...settings.sharingSettings[ moduleSlug ],
					ownerID: 2,
				},
			} ),
			{}
		);

		describe( 'setOwnerID', () => {
			it( 'requires the newOwnerIDs param', () => {
				expect( () => {
					registry.dispatch( CORE_MODULES ).setOwnerID();
				} ).toThrow( 'newOwnerIDs is required' );
			} );

			it( 'receives newOwnerIDs and sets it to the sharing settings modules', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetSharingSettings( settings );

				const state = {
					...store.getState().sharingSettings,
					...store.getState().savedSharingSettings,
				};

				registry.dispatch( CORE_MODULES ).setOwnerID( {
					analytics: 2,
					'search-console': 2,
					'pagespeed-insights': 2,
				} );

				expect( store.getState().sharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithOwnerID,
				} );
				expect( store.getState().savedSharingSettings ).toMatchObject( {
					...state,
					...sharingSettingsWithOwnerID,
				} );
			} );
		} );
	} );
} );
