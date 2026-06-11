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
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PDFFooter from './PDFFooter';

jest.mock( '@wordpress/i18n', () => {
	const actual = jest.requireActual( '@wordpress/i18n' );
	return {
		...actual,
		__: jest.fn( actual.__ ),
	};
} );

interface FooterLink {
	src: string | undefined;
	text: string;
}

/**
 * Collects every rendered link primitive, in document order, with its `src` and
 * concatenated text content. `@react-pdf/renderer` is auto-mocked (see
 * `__mocks__/@react-pdf/renderer.js`), which renders `<Link>` as a `pdf-link`
 * host element.
 *
 * @since n.e.x.t
 *
 * @param node Root JSON node produced by the test renderer.
 * @return The collected links.
 */
function collectLinks(
	node: TestRenderer.ReactTestRendererJSON | null
): FooterLink[] {
	const links: FooterLink[] = [];

	function visit(
		current:
			| string
			| number
			| TestRenderer.ReactTestRendererJSON
			| null
			| undefined
	) {
		if ( ! current || typeof current !== 'object' ) {
			return;
		}

		if ( current.type === 'pdf-link' ) {
			const text = ( current.children || [] )
				.filter(
					( child ): child is string => typeof child === 'string'
				)
				.join( '' );
			links.push( { src: current.props?.src, text } );
		}

		if ( Array.isArray( current.children ) ) {
			current.children.forEach( visit );
		}
	}

	visit( node );
	return links;
}

describe( 'PDFFooter', () => {
	const props = {
		dashboardURL:
			'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=dashboard',
		helpCenterURL:
			'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=help-center',
		privacyPolicyURL:
			'http://example.com/wp-admin/index.php?action=googlesitekit_go&to=privacy-policy',
	};

	beforeEach( () => {
		( __ as jest.Mock ).mockClear();
	} );

	function renderFooter(): TestRenderer.ReactTestRendererJSON {
		const renderer = TestRenderer.create( <PDFFooter { ...props } /> );
		const tree = renderer.toJSON();
		if ( ! tree || Array.isArray( tree ) ) {
			throw new Error( 'Unexpected render output.' );
		}
		return tree;
	}

	it( 'should render exactly three links, in the required order, with the expected labels and src values supplied via props', () => {
		const links = collectLinks( renderFooter() );

		expect( links ).toEqual( [
			{ src: props.dashboardURL, text: 'View dashboard' },
			{ src: props.helpCenterURL, text: 'Help center' },
			{ src: props.privacyPolicyURL, text: 'Privacy Policy' },
		] );
	} );

	it( 'should wrap each label in __() with the google-site-kit text domain so it translates', () => {
		renderFooter();

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
