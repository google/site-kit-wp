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
 * Internal dependencies
 */
import { getModulesData, activateOrDeactivateModule } from './index';

describe( 'getModulesData', () => {
	it( 'returns only properties that are module data', () => {
		const __googlesitekitLegacyData = {
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
		expect( getModulesData( __googlesitekitLegacyData ) ).toEqual( {
			module1: __googlesitekitLegacyData.modules.module1,
			anotherModule: __googlesitekitLegacyData.modules.anotherModule,
		} );
	} );

	it( 'passes through module data to directly modify module objects', () => {
		const __googlesitekitLegacyData = {
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
		const modulesData = getModulesData( __googlesitekitLegacyData );
		modulesData.module1.active = true;
		expect( __googlesitekitLegacyData.modules.module1.active ).toEqual( true );
	} );
} );

describe( 'activateOrDeactivateModule', () => {
	it( 'should update module "active" property to be the new status', async () => {
		const slug = 'test-module';
		const status = false;

		const originalStatus = true;
		const originalModule = { active: originalStatus };

		const restApiClient = {
			setModuleActive: jest.fn().mockResolvedValueOnce( { success: true } ),
		};

		const trackEvents = () => {};
		const getModulesDataMock = () => ( {
			[ slug ]: originalModule,
		} );

		await activateOrDeactivateModule( restApiClient, slug, status, trackEvents, getModulesDataMock );
		expect( originalModule.active ).toBeDefined();
		expect( originalModule.active ).not.toBe( originalStatus );
		expect( originalModule.active ).toBe( status );
	} );

	it( 'should call trackEvent function to track module status change event', async () => {
		const slug = 'test-module';
		const status = true;

		const restApiClient = {
			setModuleActive: jest.fn().mockResolvedValueOnce( { success: true } ),
		};

		const trackEvents = jest.fn();
		const getModulesDataMock = () => ( {} );

		await activateOrDeactivateModule( restApiClient, slug, status, trackEvents, getModulesDataMock );
		expect( trackEvents ).toHaveBeenCalled();
		expect( trackEvents ).toHaveBeenCalledWith( `test-module_setup`, 'module_activate', slug );
	} );
} );
