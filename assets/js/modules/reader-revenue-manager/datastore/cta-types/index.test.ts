/**
 * Reader Revenue Manager CTA type handler registry tests.
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
import { CTA_TYPES, getCTATypeHandler, isCTAType } from './index';

describe( 'modules/reader-revenue-manager CTA types', () => {
	describe( 'isCTAType', () => {
		it( 'should return true for a supported type', () => {
			expect( isCTAType( CTA_TYPES.NEWSLETTER_SIGNUP ) ).toBe( true );
		} );

		it.each( [
			[ 'an unsupported type', 'SUBSCRIPTION' ],
			[ 'the Site Kit CTA slug', 'newsletter-signup' ],
			[ 'undefined', undefined ],
			[ 'a number', 123 ],
			[ 'an object', {} ],
		] )( 'should return false for %s', ( _, type ) => {
			expect( isCTAType( type ) ).toBe( false );
		} );
	} );

	describe( 'getCTATypeHandler', () => {
		it( 'should return the handler for a supported type', () => {
			const handler = getCTATypeHandler( CTA_TYPES.NEWSLETTER_SIGNUP );

			expect( handler.type ).toBe( CTA_TYPES.NEWSLETTER_SIGNUP );
			expect( typeof handler.validateConfig ).toBe( 'function' );
		} );

		it( 'should throw for an unsupported type', () => {
			expect( () => getCTATypeHandler( 'SUBSCRIPTION' ) ).toThrow(
				'type is not supported.'
			);
		} );

		it( 'should throw when no type is given', () => {
			expect( () => getCTATypeHandler( undefined ) ).toThrow(
				'type is not supported.'
			);
		} );
	} );

	describe( 'newsletter sign-up validateConfig', () => {
		const { validateConfig } = getCTATypeHandler(
			CTA_TYPES.NEWSLETTER_SIGNUP
		);

		it( 'should accept a config with all supported fields', () => {
			expect( () =>
				validateConfig( {
					title: 'Subscribe',
					customMessage: 'Join our mailing list.',
					nameRequired: true,
					customConsentText: 'I agree.',
				} )
			).not.toThrow();
		} );

		it( 'should accept a partial config', () => {
			expect( () =>
				validateConfig( { title: 'Subscribe' } )
			).not.toThrow();
		} );

		it.each( [
			[ 'not an object', 'not-an-object' ],
			[ 'an array', [] ],
			[ 'undefined', undefined ],
		] )( 'should throw when the config is %s', ( _, config ) => {
			expect( () => validateConfig( config ) ).toThrow(
				'config is required and must be an object.'
			);
		} );

		it( 'should throw for an empty config', () => {
			expect( () => validateConfig( {} ) ).toThrow(
				'config is required and must be an object.'
			);
		} );

		it( 'should throw for unsupported fields', () => {
			expect( () =>
				validateConfig( {
					title: 'Subscribe',
					unknownSetting: 'value',
				} )
			).toThrow( 'config contains unsupported fields.' );
		} );

		it.each( [ 'title', 'customMessage', 'customConsentText' ] )(
			'should throw when %s is not a string',
			( field ) => {
				expect( () => validateConfig( { [ field ]: 123 } ) ).toThrow(
					`config.${ field } must be a string.`
				);
			}
		);

		it( 'should throw when nameRequired is not a boolean', () => {
			expect( () => validateConfig( { nameRequired: 'yes' } ) ).toThrow(
				'config.nameRequired must be a boolean.'
			);
		} );
	} );
} );
