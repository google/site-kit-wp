/**
 * Logo component tests.
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
import { SVGProps } from 'react';

/**
 * Internal dependencies
 */
import { render } from '@tests/js/test-utils';
import Logo from './Logo';

// `tests/js/svgrMock.js` throws its props away, leaving no class name in the
// DOM. These two mocks pass the props through, because every test here finds
// its element by class.
jest.mock(
	'@/svg/graphics/logo-g.svg',
	() => ( props: SVGProps< SVGSVGElement > ) => <svg { ...props } />
);
jest.mock(
	'@/svg/graphics/logo-sitekit.svg',
	() => ( props: SVGProps< SVGSVGElement > ) => <svg { ...props } />
);

describe( 'Logo', () => {
	it( 'renders both the Google "G" and the Site Kit logo', () => {
		const { container } = render( <Logo /> );

		expect(
			container.querySelector( '.googlesitekit-logo__logo-g' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-logo__logo-sitekit' )
		).toBeInTheDocument();
	} );

	it( 'renders the Site Kit logo at 100 by 29 and the Google "G" at 25 by 25', () => {
		const { container } = render( <Logo /> );

		const siteKitLogo = container.querySelector(
			'.googlesitekit-logo__logo-sitekit'
		);
		expect( siteKitLogo ).toHaveAttribute( 'width', '100' );
		expect( siteKitLogo ).toHaveAttribute( 'height', '29' );

		const googleG = container.querySelector(
			'.googlesitekit-logo__logo-g'
		);
		expect( googleG ).toHaveAttribute( 'width', '25' );
		expect( googleG ).toHaveAttribute( 'height', '25' );
	} );

	it( 'renders "Site Kit by Google Logo" as visually hidden text', () => {
		const { getByText } = render( <Logo /> );

		expect( getByText( 'Site Kit by Google Logo' ) ).toBeInTheDocument();
	} );
} );
