/**
 * AdSense Use Snippet Switch component tests.
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
 * WordPress dependencies
 */
import apiFetchMock from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import UseSnippetSwitch from './UseSnippetSwitch';
import { fireEvent, render, act } from '../../../../../../tests/js/test-utils';
import { subscribeUntil } from '../../../../../../tests/js/utils';
import { MODULES_ADSENSE } from '../../datastore/constants';

// Mock apiFetch so we know if it's called.
jest.mock( '@wordpress/api-fetch' );
apiFetchMock.mockImplementation( ( ...args ) => {
	// eslint-disable-next-line no-console
	console.warn( 'apiFetch', ...args );
} );

const getSetupRegistry = ( useSnippetValue ) => {
	return ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			useSnippet: useSnippetValue,
		} );
	};
};

describe( 'UseSnippetSwitch', () => {
	afterEach( () => apiFetchMock.mockClear() );

	it( 'should update useSnippet in the store when toggled', () => {
		const { container, registry } = render( <UseSnippetSwitch />, {
			setupRegistry: getSetupRegistry( false ),
		} );
		const originalUseSnippet = registry
			.select( MODULES_ADSENSE )
			.getUseSnippet();
		expect( originalUseSnippet ).toBe( false );

		// Click the switch to fire the onChange event.
		fireEvent.click( container.querySelector( '.mdc-switch' ) );

		const newUseSnippet = registry
			.select( MODULES_ADSENSE )
			.getUseSnippet();
		expect( newUseSnippet ).toBe( true );

		// By default, useSnippet should not be persisted with server.
		expect( apiFetchMock ).not.toHaveBeenCalled();
	} );

	it( 'should render nothing when useSnippet is undefined', () => {
		const { container } = render( <UseSnippetSwitch />, {
			setupRegistry: getSetupRegistry( undefined ),
		} );

		expect( container.firstChild ).toEqual( null );
	} );

	it( 'should persist useSnippet when saveOnChange prop is enabled', async () => {
		const { container, registry } = render(
			<UseSnippetSwitch saveOnChange />,
			{ setupRegistry: getSetupRegistry( false ) }
		);
		const originalUseSnippet = registry
			.select( MODULES_ADSENSE )
			.getUseSnippet();
		expect( originalUseSnippet ).toBe( false );

		apiFetchMock.mockImplementationOnce( () => {} );
		// Click the switch to fire the onChange event.
		fireEvent.click( container.querySelector( '.mdc-switch' ) );

		const newUseSnippet = registry
			.select( MODULES_ADSENSE )
			.getUseSnippet();
		await act( () =>
			subscribeUntil( registry, () =>
				registry
					.select( MODULES_ADSENSE )
					.hasFinishedResolution( 'getSettings' )
			)
		);
		expect( newUseSnippet ).toBe( true );

		// Ensure API call is issued.
		expect( apiFetchMock ).toHaveBeenCalled();
	} );
} );
