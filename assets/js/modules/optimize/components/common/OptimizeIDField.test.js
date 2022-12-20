/**
 * OptimizeIDField component tests.
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
import OptimizeIDField from './OptimizeIDField';
import { render } from '../../../../../../tests/js/test-utils';
import { MODULES_OPTIMIZE } from '../../datastore/constants';
import { createTestRegistry } from '../../../../../../tests/js/utils';

describe( 'OptimizeIDField', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		// Set settings to prevent fetch in resolver.
		registry.dispatch( MODULES_OPTIMIZE ).setSettings( {} );
	} );

	it( 'should render with a valid optimize container id passed', () => {
		registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( 'OPT-1234567' );

		const { container } = render( <OptimizeIDField />, { registry } );

		expect(
			container.querySelector( '.mdc-text-field' )
		).toBeInTheDocument();
		expect( container.querySelector( '.mdc-text-field' ) ).not.toHaveClass(
			'mdc-text-field--error'
		);
	} );

	it( 'should display an error message with an invalid optimize container id passed', () => {
		registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( 'OPT' );

		const { container } = render( <OptimizeIDField />, { registry } );

		expect(
			container.querySelector( '.mdc-text-field' )
		).toBeInTheDocument();
		expect( container.querySelector( '.mdc-text-field' ) ).toHaveClass(
			'mdc-text-field--error'
		);
	} );

	it( 'should not display an error message with no optimize container id passed', () => {
		registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( '' );

		const { container } = render( <OptimizeIDField />, { registry } );

		expect(
			container.querySelector( '.mdc-text-field' )
		).toBeInTheDocument();
		expect( container.querySelector( '.mdc-text-field' ) ).not.toHaveClass(
			'mdc-text-field--error'
		);
	} );
} );
