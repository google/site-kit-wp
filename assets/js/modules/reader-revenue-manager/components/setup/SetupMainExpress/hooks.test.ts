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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	render,
	renderHook,
} from '@tests/js/test-utils';
import { useHasPreExistingCTAs, useStep } from './hooks';

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

describe( 'useHasPreExistingCTAs', () => {
	let registry: WPDataRegistry;

	const publicationID = 'ABCD_123-4';

	const ctasEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/ctas'
	);

	const cta = {
		name: `organizations/ABCD1234/publications/${ publicationID }/ctas/9d2418415-ab3a`,
		type: 'NEWSLETTER_SIGNUP',
	};

	const otherCTA = {
		name: `organizations/ABCD1234/publications/${ publicationID }/ctas/8j8152411-cd4b`,
		type: 'NEWSLETTER_SIGNUP',
	};

	beforeEach( () => {
		registry = createTestRegistry();
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( { publicationID } );
	} );

	it( 'returns undefined while the CTAs are loading', () => {
		fetchMock.getOnce( ctasEndpoint, { body: [ cta ], status: 200 } );

		const { result, unmount } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBeUndefined();

		unmount();
	} );

	it( 'returns false when there are no configured CTAs', () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetCTAs( { ctas: [], params: { publicationID } } );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'returns false when there is only the CTA just created in this setup flow', () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetCTAs( { ctas: [ cta ], params: { publicationID } } );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'returns true when there is more than one configured CTA', () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetCTAs( {
			ctas: [ cta, otherCTA ],
			params: { publicationID },
		} );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( true );
	} );
} );
