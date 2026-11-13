/**
 * Reader Revenue Manager express setup `useHasExistingCTAs` hook tests.
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
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	CTA_STATES,
	CTA_TYPES,
} from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import useHasExistingCTAs from './useHasExistingCTAs';

// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
const PUBLICATION_ID = publications[ 0 ].publicationId;

describe( 'useHasExistingCTAs', () => {
	let registry: WPDataRegistry;

	const newsletterCTA = {
		name: `organizations/ABCD1234/publications/${ PUBLICATION_ID }/ctas/1`,
		type: CTA_TYPES.NEWSLETTER_SIGNUP,
		state: CTA_STATES.ACTIVE,
	};

	function receiveCTAs( ctas: unknown[] ) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetCTAs( { publicationID: PUBLICATION_ID, ctas } );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		providePublication( registry, publications[ 0 ] );
	} );

	it.each( [
		[ 'active', CTA_STATES.ACTIVE ],
		[ 'draft', CTA_STATES.DRAFT ],
	] )(
		'returns true when the publication has a %s CTA of the type',
		( _, state ) => {
			receiveCTAs( [ { ...newsletterCTA, state } ] );

			const { result } = renderHook(
				() =>
					useHasExistingCTAs(
						PUBLICATION_ID,
						EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
					),
				{ registry }
			);

			expect( result.current ).toBe( true );
		}
	);

	it( 'returns false when the publication only has CTAs of other types', () => {
		receiveCTAs( [ { ...newsletterCTA, type: 'SURVEY' } ] );

		const { result } = renderHook(
			() =>
				useHasExistingCTAs(
					PUBLICATION_ID,
					EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
				),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'returns the result on the first render when the CTAs are already loaded', () => {
		receiveCTAs( [ newsletterCTA ] );

		// Every result the hook returns, render by render.
		const results: ( boolean | undefined )[] = [];

		renderHook(
			() => {
				const result = useHasExistingCTAs(
					PUBLICATION_ID,
					EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
				);

				results.push( result );

				return result;
			},
			{ registry }
		);

		expect( results[ 0 ] ).toBe( true );
	} );

	it( 'checks only once per publication and CTA type', () => {
		receiveCTAs( [] );

		const { result } = renderHook(
			() =>
				useHasExistingCTAs(
					PUBLICATION_ID,
					EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
				),
			{ registry }
		);

		expect( result.current ).toBe( false );

		// A CTA created in the setup reloads the CTAs.
		act( () => {
			receiveCTAs( [ newsletterCTA ] );
		} );

		expect( result.current ).toBe( false );
	} );
} );
