/**
 * Tag Manager useGAPropertyIDEffect hook tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { MODULES_TAGMANAGER } from '../datastore/constants';
import { createBuildAndReceivers } from '../datastore/__factories__/utils';
import useGAPropertyIDEffect from './useGAPropertyIDEffect';

describe( 'useGAPropertyIDEffect', () => {
	let registry;

	describe( 'with empty Tag Manager settings store', () => {
		beforeEach( () => {
			registry = createTestRegistry();
		} );

		it( 'fetches settings from API if the settings are empty', async () => {
			fetchMock.getOnce(
				/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/settings/,
				{
					body: {},
					status: 200,
				}
			);

			await act(
				() =>
					new Promise( ( resolve ) => {
						renderHook( () => useGAPropertyIDEffect(), {
							registry,
						} );
						resolve();
					} )
			);

			await act( waitForDefaultTimeouts );

			expect( fetchMock ).toHaveFetched(
				new RegExp(
					'^/google-site-kit/v1/modules/tagmanager/data/settings'
				)
			);
		} );
	} );

	describe( 'with a populated Tag Manager store', () => {
		beforeEach( () => {
			registry = createTestRegistry();
			// Set settings to prevent fetch in resolver.
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {} );
			// Set set no existing tag.
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetExistingTag( null );
		} );

		it( 'sets the gaPropertyID with the current detected singular property ID in selected containers', async () => {
			const { buildAndReceiveWebAndAMP } =
				createBuildAndReceivers( registry );

			const TEST_GA_PROPERTY_ID = '12345678';

			buildAndReceiveWebAndAMP( {
				webPropertyID: TEST_GA_PROPERTY_ID,
			} );

			await act(
				() =>
					new Promise( ( resolve ) => {
						renderHook( () => useGAPropertyIDEffect(), {
							registry,
						} );
						resolve();
					} )
			);

			const propertyID = registry
				.select( MODULES_TAGMANAGER )
				.getGAPropertyID();

			expect( propertyID ).toBe( TEST_GA_PROPERTY_ID );
		} );
	} );
} );
