/**
 * EnhancedMeasurementSetupEffect component tests.
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
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import EnhancedMeasurementSetupEffect from './EnhancedMeasurementSetupEffect';

describe( 'EnhancedMeasurementSetupEffect', () => {
	let registry: Registry;
	let setupFeature: jest.SpyInstance;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		setupFeature = jest
			.spyOn(
				registry.dispatch( CORE_FEATURE_DISCOVERY ),
				'setupFeature'
			)
			.mockResolvedValue( {} );
	} );

	function setAutoSubmit( autoSubmit: boolean ) {
		registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, { autoSubmit } );
	}

	it( 'should render nothing', () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		const { container } = render( <EnhancedMeasurementSetupEffect />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should resume enabling enhanced measurement once, and clear autoSubmit, when the save was marked to resume and the edit scope is granted', () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		setAutoSubmit( true );

		const { rerender } = render( <EnhancedMeasurementSetupEffect />, {
			registry,
		} );

		rerender( <EnhancedMeasurementSetupEffect /> );

		expect( setupFeature ).toHaveBeenCalledTimes( 1 );
		expect( setupFeature ).toHaveBeenCalledWith( 'enhanced-measurement' );
		expect(
			registry.select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' )
		).toBe( false );
	} );

	it( 'should do nothing when the save was not marked to resume', () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		render( <EnhancedMeasurementSetupEffect />, { registry } );

		expect( setupFeature ).not.toHaveBeenCalled();
	} );

	it( 'should do nothing when the edit scope is not granted', () => {
		provideUserAuthentication( registry, { grantedScopes: [] } );
		setAutoSubmit( true );

		render( <EnhancedMeasurementSetupEffect />, { registry } );

		expect( setupFeature ).not.toHaveBeenCalled();
		expect(
			registry.select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' )
		).toBe( true );
	} );
} );
