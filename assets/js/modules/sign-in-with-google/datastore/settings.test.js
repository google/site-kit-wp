/**
 * `modules/sign-in-with-google` data store: settings tests.
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
import {
	MODULES_SIGN_IN_WITH_GOOGLE,
	SIGN_IN_WITH_GOOGLE_SHAPES,
	SIGN_IN_WITH_GOOGLE_SHAPE_RECTANGULAR,
	SIGN_IN_WITH_GOOGLE_TEXTS,
	SIGN_IN_WITH_GOOGLE_TEXT_CONTINUE_WITH_GOOGLE,
	SIGN_IN_WITH_GOOGLE_THEMES,
	SIGN_IN_WITH_GOOGLE_THEME_LIGHT,
} from './constants';
import { validateCanSubmitChanges } from './settings';

describe( 'modules/sign-in-with-google settings', () => {
	let registry;
	const validSettings = {
		clientID:
			'40021282855-d4ea9t80ph5m5pjjob24qdaj1suqg065.apps.googleusercontent.com',
		shape: SIGN_IN_WITH_GOOGLE_SHAPE_RECTANGULAR.value,
		text: SIGN_IN_WITH_GOOGLE_TEXT_CONTINUE_WITH_GOOGLE.value,
		theme: SIGN_IN_WITH_GOOGLE_THEME_LIGHT.value,
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();

		registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveGetSettings( validSettings );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'validateCanSubmitChanges', () => {
		it( 'should throw invariant error for missing client ID', () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.setSettings( { clientID: null } );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				'clientID is required'
			);
		} );

		it( 'should throw invariant error for empty client ID', () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.setSettings( { clientID: '' } );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				'clientID is required'
			);
		} );

		it( 'should accept a client ID with characters', () => {
			// IDs are not validated beyond not being empty.
			registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).setSettings( {
				clientID: 'ids-are-not-validated-beyond-not-being-empty',
			} );

			expect( () =>
				validateCanSubmitChanges( registry.select )
			).not.toThrow();
		} );

		it( 'should throw invariant error for invalid shape', () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.setSettings( { shape: 'hexagon' } );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				`shape must be one of: ${ SIGN_IN_WITH_GOOGLE_SHAPES.map(
					( option ) => option.value
				).join( ', ' ) }`
			);
		} );

		it( 'should throw invariant error for invalid text', () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.setSettings( { text: 'Authenticate with Googlebot' } );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				`text must be one of: ${ SIGN_IN_WITH_GOOGLE_TEXTS.map(
					( option ) => option.value
				).join( ', ' ) }`
			);
		} );

		it( 'should throw invariant error for invalid theme', () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.setSettings( { theme: 'purple-and-green' } );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				`theme must be one of: ${ SIGN_IN_WITH_GOOGLE_THEMES.map(
					( option ) => option.value
				).join( ', ' ) }`
			);
		} );
	} );
} );
