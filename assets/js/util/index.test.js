/**
 * Utility functions tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Mocked dependencies
 */
jest.mock( './tracking/index' );

/**
 * External dependencies
 */
import { lorem, random } from 'faker';

/**
 * Internal dependencies
 */
import { getModulesData, activateOrDeactivateModule } from './index';

describe( 'getModulesData', () => {
	it( 'returns only properties that are module data', () => {
		const _googlesitekit = {
			modules: {
				module1: {
					slug: 'module1',
					name: 'Module 1',
					description: 'Module 1 description.',
					active: false,
				},
				anotherModule: {
					slug: 'anotherModule',
					name: 'Another Module',
					description: 'Another Module description.',
					active: false,
				},
				anAPIFunction: () => true,
			},
		};
		expect( getModulesData( _googlesitekit ) ).toEqual( {
			module1: _googlesitekit.modules.module1,
			anotherModule: _googlesitekit.modules.anotherModule,
		} );
	} );

	it( 'passes through module data to directly modify module objects', () => {
		const _googlesitekit = {
			modules: {
				module1: {
					slug: 'module1',
					name: 'Module 1',
					description: 'Module 1 description.',
					active: false,
				},
				anotherModule: {
					slug: 'anotherModule',
					name: 'Another Module',
					description: 'Another Module description.',
					active: false,
				},
				anAPIFunction: () => true,
			},
		};
		const modulesData = getModulesData( _googlesitekit );
		modulesData.module1.active = true;
		expect( _googlesitekit.modules.module1.active ).toEqual( true );
	} );
} );

describe( 'activateOrDeactivateModule', () => {
	it( 'should call setModuleActive method of the provided restApiClient object', () => {
		const setModuleActive = jest.fn();

		// use "Promise.reject()" and ".catch( () => {} )" to prevent main logic execution
		setModuleActive.mockReturnValueOnce( Promise.reject() );
		activateOrDeactivateModule( { setModuleActive }, '', '' ).catch( () => {} );

		expect( setModuleActive ).toHaveBeenCalled();
	} );

	it( 'should call setModuleActive method with correct arguments', () => {
		const setModuleActive = jest.fn();
		const slug = lorem.slug();
		const status = random.boolean();

		// use "Promise.reject()" and ".catch( () => {} )" to prevent main logic execution
		setModuleActive.mockReturnValueOnce( Promise.reject() );
		activateOrDeactivateModule( { setModuleActive }, slug, status ).catch( () => {} );

		expect( setModuleActive ).toHaveBeenCalledWith( slug, status );
	} );

	describe( 'success logic', () => {
		let _googlesitekit;
		let slug;
		let status;
		let responseData;
		let originalModule;
		let originalStatus;
		let restApiClient;
		let trackEventFn;

		beforeAll( () => {
			_googlesitekit = global.googlesitekit;
		} );

		beforeEach( () => {
			slug = lorem.slug();
			status = random.boolean();
			originalStatus = ! status;
			responseData = random.number(); // value doesn't matter
			trackEventFn = jest.fn();

			originalModule = {
				slug,
				name: lorem.word(),
				active: originalStatus,
			};

			global.googlesitekit = {
				modules: {
					[ slug ]: originalModule,
				},
			};

			restApiClient = {
				setModuleActive: jest.fn().mockResolvedValueOnce( responseData ),
			};

			require( './tracking/index' ).__setTrackEventMockFn( trackEventFn );
		} );

		afterAll( () => {
			global.googlesitekit = _googlesitekit;
		} );

		it( 'should resolve with responseData returned from API', () => {
			return expect( activateOrDeactivateModule( restApiClient, slug, status ) ).resolves.toBe( responseData );
		} );

		it( 'should update module "active" property to be the new status', async () => {
			await activateOrDeactivateModule( restApiClient, slug, status );
			expect( originalModule.active ).toBeDefined();
			expect( originalModule.active ).not.toBe( originalStatus );
			expect( originalModule.active ).toBe( status );
		} );

		it( 'should call trackEvent function to track module status change event', async () => {
			await activateOrDeactivateModule( restApiClient, slug, status );
			expect( trackEventFn ).toHaveBeenCalled();
			expect( trackEventFn ).toHaveBeenCalledWith(
				`${ slug }_setup`,
				! status ? 'module_deactivate' : 'module_activate',
				slug,
			);
		} );
	} );
} );
