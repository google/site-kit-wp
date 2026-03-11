/**
 * SideSheet tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { render } from '../../../tests/js/test-utils';
import SideSheet from './SideSheet';

describe( 'SideSheet', () => {
	afterEach( () => {
		document.getElementById( 'wpadminbar' )?.remove();
	} );

	function createAdminBar( { top, bottom, height } ) {
		const adminBar = document.createElement( 'div' );
		adminBar.id = 'wpadminbar';
		adminBar.getBoundingClientRect = jest.fn().mockReturnValue( {
			top,
			bottom,
			height,
		} );
		document.body.appendChild( adminBar );
	}

	it( 'should not have an --open class by default', () => {
		render( <SideSheet>Side Sheet content</SideSheet> );

		expect(
			document.querySelector( '.googlesitekit-side-sheet' )
		).not.toHaveClass( 'googlesitekit-side-sheet--open' );
	} );

	it( 'should have an --open class when opened', () => {
		render( <SideSheet isOpen>Side Sheet content</SideSheet> );

		expect(
			document.querySelector( '.googlesitekit-side-sheet' )
		).toHaveClass( 'googlesitekit-side-sheet--open' );
	} );

	it( 'should not have an overlay by default', () => {
		render( <SideSheet>Side Sheet content</SideSheet> );

		expect(
			document.querySelector( '.googlesitekit-side-sheet-overlay' )
		).not.toBeInTheDocument();
	} );

	it( 'should have an overlay when opened', () => {
		render( <SideSheet isOpen>Side Sheet content</SideSheet> );

		expect(
			document.querySelector( '.googlesitekit-side-sheet-overlay' )
		).toBeInTheDocument();
	} );

	it( 'should lock document scroll when opened', () => {
		render( <SideSheet isOpen>Side Sheet content</SideSheet> );

		expect( document.body ).toHaveClass(
			'googlesitekit-side-sheet-scroll-lock'
		);
	} );

	it( 'should allow links within tooltips to be clicked without closing the SideSheet', () => {
		render(
			<SideSheet isOpen>
				<div className="googlesitekit-tooltip-popper">
					<a href="#tooltip-link">Tooltip Link</a>
				</div>
			</SideSheet>
		);

		const tooltipLink = document.querySelector(
			'.googlesitekit-tooltip-popper a'
		);
		expect( tooltipLink ).toBeInTheDocument();

		tooltipLink.click();

		expect(
			document.querySelector( '.googlesitekit-side-sheet' )
		).toHaveClass( 'googlesitekit-side-sheet--open' );
	} );

	it( 'should apply a zero top offset when wp admin bar is hidden', () => {
		createAdminBar( { top: -46, bottom: 0, height: 46 } );

		render( <SideSheet isOpen>Side Sheet content</SideSheet> );

		expect(
			document
				.querySelector( '.googlesitekit-side-sheet' )
				.style.getPropertyValue( '--googlesitekit-side-sheet-top' )
		).toBe( '0px' );
	} );

	it( 'should apply a non-zero top offset when wp admin bar is visible', () => {
		createAdminBar( { top: 0, bottom: 46, height: 46 } );

		render( <SideSheet isOpen>Side Sheet content</SideSheet> );

		expect(
			document
				.querySelector( '.googlesitekit-side-sheet' )
				.style.getPropertyValue( '--googlesitekit-side-sheet-top' )
		).toBe( '46px' );
	} );
} );
