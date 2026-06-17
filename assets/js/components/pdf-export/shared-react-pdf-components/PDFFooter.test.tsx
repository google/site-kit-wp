/**
 * PDFFooter tests.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { render } from '@tests/js/test-utils';
import PDFFooter from './PDFFooter';

jest.mock( '@wordpress/i18n', () => {
	const actual = jest.requireActual( '@wordpress/i18n' );
	return {
		...actual,
		__: jest.fn( actual.__ ),
	};
} );

describe( 'PDFFooter', () => {
	const props = {
		dashboardURL: 'https://example.com/dashboard',
		helpCenterURL: 'https://example.com/help-center',
		privacyPolicyURL: 'https://example.com/privacy-policy',
	};

	beforeEach( () => {
		( __ as jest.Mock ).mockClear();
	} );

	it( 'should render exactly three links, in the required order, with the expected labels and src values supplied via props', () => {
		const { container } = render( <PDFFooter { ...props } /> );

		const links = Array.from(
			container.querySelectorAll( 'pdf-link' )
		).map( ( link ) => ( {
			src: link.getAttribute( 'src' ),
			text: link.textContent,
		} ) );

		expect( links ).toEqual( [
			{ src: props.dashboardURL, text: 'View dashboard' },
			{ src: props.helpCenterURL, text: 'Help center' },
			{ src: props.privacyPolicyURL, text: 'Privacy Policy' },
		] );
	} );

	it( 'should wrap each label in __() with the google-site-kit text domain so it translates', () => {
		render( <PDFFooter { ...props } /> );

		expect( __ ).toHaveBeenCalledWith(
			'View dashboard',
			'google-site-kit'
		);
		expect( __ ).toHaveBeenCalledWith( 'Help center', 'google-site-kit' );
		expect( __ ).toHaveBeenCalledWith(
			'Privacy Policy',
			'google-site-kit'
		);
	} );
} );
