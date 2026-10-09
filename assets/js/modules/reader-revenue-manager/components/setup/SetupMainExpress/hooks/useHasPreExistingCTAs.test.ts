/**
 * Reader Revenue Manager express setup `useHasPreExistingCTAs` hook tests.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import {
	createTestRegistry,
	muteFetch,
	renderHook,
} from '@tests/js/test-utils';
import useHasPreExistingCTAs from './useHasPreExistingCTAs';

// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
const PUBLICATION_ID = publications[ 0 ].publicationId;

describe( 'useHasPreExistingCTAs', () => {
	let registry: WPDataRegistry;

	const ctasEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/ctas'
	);

	const cta = {
		name: `organizations/ABCD1234/publications/${ PUBLICATION_ID }/ctas/9d2418415-ab3a`,
		type: 'NEWSLETTER_SIGNUP',
	};

	const otherCTA = {
		name: `organizations/ABCD1234/publications/${ PUBLICATION_ID }/ctas/8j8152411-cd4b`,
		type: 'NEWSLETTER_SIGNUP',
	};

	beforeEach( () => {
		registry = createTestRegistry();
		providePublication( registry, publications[ 0 ] );
	} );

	it( 'returns undefined while the CTAs are loading', () => {
		muteFetch( ctasEndpoint );

		const { result, unmount } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBeUndefined();

		unmount();
	} );

	it( 'returns false when there are no configured CTAs', () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetCTAs( {
			ctas: [],
			params: { publicationID: PUBLICATION_ID },
		} );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'returns false when there is only the CTA just created in this setup flow', () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetCTAs( {
			ctas: [ cta ],
			params: { publicationID: PUBLICATION_ID },
		} );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'returns true when there is more than one configured CTA', () => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetCTAs( {
			ctas: [ cta, otherCTA ],
			params: { publicationID: PUBLICATION_ID },
		} );

		const { result } = renderHook( () => useHasPreExistingCTAs(), {
			registry,
		} );

		expect( result.current ).toBe( true );
	} );
} );
