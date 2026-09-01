/**
 * Reader Revenue Manager express setup hooks tests.
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
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { fireEvent, render } from '@tests/js/test-utils';
import { useStep } from './hooks';

function TestComponent() {
	const [ step, setStep ] = useStep();

	return createElement(
		'button',
		{
			onClick: () => setStep( EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ),
			type: 'button',
		},
		step
	);
}

describe( 'useStep', () => {
	mockLocation();

	it( 'reactively updates the step when setStep is called', () => {
		global.location.href = 'http://example.com/';

		const { getByRole } = render( createElement( TestComponent ) );
		const button = getByRole( 'button' );

		expect( button ).toBeEmptyDOMElement();

		fireEvent.click( button );

		expect( button ).toHaveTextContent(
			EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
		);
	} );

	it( 'uses the step query parameter as the initial value', () => {
		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION }`;

		const { getByRole } = render( createElement( TestComponent ) );

		expect( getByRole( 'button' ) ).toHaveTextContent(
			EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION
		);
	} );
} );
