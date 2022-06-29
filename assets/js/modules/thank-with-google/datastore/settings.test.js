/**
 * `modules/thank-with-google` data store: settings tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import defaultModules from '../../../googlesitekit/modules/datastore/__fixtures__';
import {
	createTestRegistry,
	muteFetch,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { createCacheKey } from '../../../googlesitekit/api';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_THANK_WITH_GOOGLE } from './constants';
import {
	INVARIANT_INVALID_BUTTON_PLACEMENT,
	INVARIANT_INVALID_COLOR_THEME,
	INVARIANT_INVALID_PUBLICATION_ID,
} from './settings';

describe( 'modules/thank-with-google settings', () => {
	let registry;

	const defaultSettings = {
		publicationID: '',
		colorTheme: '',
		buttonPlacement: '',
		buttonPostTypes: [],
	};

	const validSettings = {
		publicationID: 'publisher.com',
		colorTheme: 'light',
		buttonPlacement: 'bottom-right',
		buttonPostTypes: [ 'post' ],
	};

	const WPError = {
		code: 'internal_error',
		message: 'Something wrong happened.',
		data: { status: 500 },
	};

	const fetchPattern = /^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/settings/;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'submitChanges', () => {
			it( 'dispatches saveSettings', async () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setSettings( validSettings );

				fetchMock.postOnce( fetchPattern, {
					body: validSettings,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.submitChanges();

				expect( fetchMock ).toHaveFetched( fetchPattern, {
					body: { data: validSettings },
				} );

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.haveSettingsChanged()
				).toBe( false );
			} );

			it( 'returns an error if saveSettings fails', async () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setSettings( validSettings );

				fetchMock.postOnce( fetchPattern, {
					body: WPError,
					status: 500,
				} );

				const result = await registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.submitChanges();

				expect( fetchMock ).toHaveFetched( fetchPattern, {
					body: { data: validSettings },
				} );
				expect( result.error ).toEqual( WPError );
				expect( console ).toHaveErrored();
			} );

			it( 'invalidates module cache on success', async () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setSettings( validSettings );

				muteFetch( fetchPattern );
				const cacheKey = createCacheKey(
					'modules',
					'thank-with-google',
					'arbitrary-datapoint'
				);
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).not.toBeFalsy();

				await registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'returns true while submitting changes', async () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetSettings( validSettings );

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.haveSettingsChanged()
				).toBe( false );
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.isDoingSubmitChanges()
				).toBe( false );

				const promise = registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.submitChanges();

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.isDoingSubmitChanges()
				).toBe( true );

				await promise;

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.isDoingSubmitChanges()
				).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			beforeEach( () => {
				// Preload default settings to prevent the resolver from making unexpected requests
				// as this is covered in settings store tests.
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetSettings( defaultSettings );

				registry
					.dispatch( CORE_SITE )
					.receiveSiteInfo( { ampMode: false } );
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setSettings( validSettings );
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( defaultModules );
			} );

			it( 'requires a valid publicationID', () => {
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.canSubmitChanges()
				).toBe( true );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( '!' );

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.canSubmitChanges()
				).toBe( false );
				expect( () =>
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_PUBLICATION_ID );
			} );

			it( 'requires a valid color theme', () => {
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.canSubmitChanges()
				).toBe( true );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setColorTheme( '' );

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.canSubmitChanges()
				).toBe( false );
				expect( () =>
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_COLOR_THEME );
			} );

			it( 'requires a valid button placement', () => {
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.canSubmitChanges()
				).toBe( true );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setButtonPlacement( '' );

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.canSubmitChanges()
				).toBe( false );
				expect( () =>
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_BUTTON_PLACEMENT );
			} );
		} );
	} );
} );
