/**
 * OptimizeIDField component tests.
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
import OptimizeIDField from './optimize-id-field';
import { render } from '../../../../../tests/js/test-utils';
import { STORE_NAME } from '../datastore/constants';

const optimizeIDFieldRegistery = ( registry ) => {
	registry.dispatch( STORE_NAME ).setOptimizeID( 'OPT-1234567' );
};

const invalidOptimizeIDFieldRegistery = ( registry ) => {
	registry.dispatch( STORE_NAME ).setOptimizeID( 'OPT' );
};

const noOptimizeIDFieldRegistery = ( registry ) => {
	registry.dispatch( STORE_NAME ).setOptimizeID( '' );
};

describe( 'OptimizeIDField', () => {
	it( 'should render with a valid optimize id passed', () => {
		const { container } = render( <OptimizeIDField />, { setupRegistry: optimizeIDFieldRegistery } );

		expect( container.querySelector( '.mdc-text-field' ) ).not.toEqual( null );
		expect( container.querySelector( '.mdc-text-field--error' ) ).toEqual( null );
	} );
	it( 'should display an error message with an invalid optimize id passed', () => {
		const { container } = render( <OptimizeIDField />, { setupRegistry: invalidOptimizeIDFieldRegistery } );

		expect( container.querySelector( '.mdc-text-field' ) ).not.toEqual( null );
		expect( container.querySelector( '.mdc-text-field--error' ) ).not.toEqual( null );
	} );
	it( 'should display an error message with no optimize id passed', () => {
		const { container } = render( <OptimizeIDField />, { setupRegistry: noOptimizeIDFieldRegistery } );

		expect( container.querySelector( '.mdc-text-field' ) ).not.toEqual( null );
		expect( container.querySelector( '.mdc-text-field--error' ) ).not.toEqual( null );
	} );
} );
