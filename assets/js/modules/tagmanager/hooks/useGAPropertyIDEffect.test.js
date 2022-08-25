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
 * Internal dependencies
 */
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../tests/js/utils';
import { MODULES_TAGMANAGER } from '../datastore/constants';
import { createBuildAndReceivers } from '../datastore/__factories__/utils';
import useGAPropertyIDEffect from './useGAPropertyIDEffect';

describe( 'useGAPropertyIDEffect', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {} );
		// Set set no existing tag.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
	} );

	it( 'sets the gaPropertyID with the current detected singular property ID in selected containers', async () => {
		const { buildAndReceiveWebAndAMP } =
			createBuildAndReceivers( registry );

		const TEST_GA_PROPERTY_ID = 'UA-123456789-1';

		buildAndReceiveWebAndAMP( {
			webPropertyID: TEST_GA_PROPERTY_ID,
		} );

		await act(
			() =>
				new Promise( async ( resolve ) => {
					renderHook( () => useGAPropertyIDEffect(), { registry } );
					resolve();
				} )
		);

		const propertyID = registry
			.select( MODULES_TAGMANAGER )
			.getGAPropertyID();

		expect( propertyID ).toBe( TEST_GA_PROPERTY_ID );
	} );
} );
