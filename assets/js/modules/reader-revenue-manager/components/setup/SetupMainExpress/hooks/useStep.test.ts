/**
 * Reader Revenue Manager express setup `useStep` hook tests.
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
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { EXPRESS_SETUP_STEP_UI_KEY } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import useStep from './useStep';

function TestComponent() {
	const [ step, setStep ] = useStep();

	return createElement(
		'button',
		{
			onClick: () => setStep( 'terms-of-service' ),
			type: 'button',
		},
		step
	);
}

describe( 'useStep', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( 'should use the step query argument as the initial value', () => {
		global.location.href = 'http://example.com/?step=connect-publication';

		const { getByRole } = render( createElement( TestComponent ), {
			registry,
		} );

		expect( getByRole( 'button' ) ).toHaveTextContent(
			'connect-publication'
		);
	} );

	it( 'should be undefined when no step query argument is set', () => {
		global.location.href = 'http://example.com/';

		const { getByRole } = render( createElement( TestComponent ), {
			registry,
		} );

		expect( getByRole( 'button' ) ).toBeEmptyDOMElement();
	} );

	it( 'should not navigate to another step by itself', () => {
		global.location.href = 'http://example.com/?step=setup-complete';

		const { getByRole } = render( createElement( TestComponent ), {
			registry,
		} );

		expect( getByRole( 'button' ) ).toHaveTextContent( 'setup-complete' );
	} );

	it( 'should reactively update the step, the UI value and the query argument when set', () => {
		global.location.href = 'http://example.com/?step=connect-publication';

		const { getByRole } = render( createElement( TestComponent ), {
			registry,
		} );
		const button = getByRole( 'button' );

		fireEvent.click( button );

		expect( button ).toHaveTextContent( 'terms-of-service' );
		expect(
			registry.select( CORE_UI ).getValue( EXPRESS_SETUP_STEP_UI_KEY )
		).toBe( 'terms-of-service' );
		expect( global.location.href ).toContain( 'step=terms-of-service' );
	} );
} );
