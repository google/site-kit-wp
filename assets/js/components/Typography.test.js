/**
 * Typography tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import Typography from './Typography';

describe( 'Typography', () => {
	it( 'renders children correctly', () => {
		const { getByText } = render( <Typography>Test Text</Typography> );
		expect( getByText( /Test Text/ ) ).toBeInTheDocument();
	} );

	it( 'renders default as <span> if no `as` prop is provided', () => {
		const { getByText } = render( <Typography>Text</Typography> );
		const element = getByText( /Text/ );

		expect( element.tagName ).toBe( 'SPAN' );
	} );

	it( 'renders as the given element tag when `as` prop is provided', () => {
		const { getByText } = render(
			<Typography as="h2">Heading</Typography>
		);
		const element = getByText( /Heading/ );

		expect( element.tagName ).toBe( 'H2' );
	} );

	it( 'adds the base class `googlesitekit-typography`', () => {
		const { getByText } = render( <Typography>Text</Typography> );
		const element = getByText( /Text/ );

		expect( element ).toHaveClass( 'googlesitekit-typography' );
	} );

	it( 'adds custom className if provided', () => {
		const { getByText } = render(
			<Typography className="custom-class">Text</Typography>
		);
		const element = getByText( /Text/ );

		expect( element ).toHaveClass( 'custom-class' );
	} );

	it( 'applies type and size modifiers correctly', () => {
		const { getByText } = render(
			<Typography type="headline" size="large">
				Text
			</Typography>
		);
		const element = getByText( /Text/ );

		expect( element ).toHaveClass( 'googlesitekit-typography--headline' );
		expect( element ).toHaveClass( 'googlesitekit-typography--large' );
	} );

	it( 'does not add type/size class if props are undefined', () => {
		const { getByText } = render( <Typography>Text</Typography> );
		const element = getByText( /Text/ );

		expect( element.className ).not.toMatch(
			/googlesitekit-typography--(headline|large)/
		);
	} );

	it.each( [
		[ 'display' ],
		[ 'headline' ],
		[ 'title' ],
		[ 'body' ],
		[ 'label' ],
	] )( 'supports type: %s', ( type ) => {
		const { getByText } = render(
			<Typography type={ type }>Typed</Typography>
		);

		expect( getByText( /Typed/ ) ).toHaveClass(
			`googlesitekit-typography--${ type }`
		);
	} );

	it.each( [ 'small', 'medium', 'large' ] )(
		'supports size: %s',
		( size ) => {
			const { getByText } = render(
				<Typography size={ size }>Sized</Typography>
			);

			expect( getByText( /Sized/ ) ).toHaveClass(
				`googlesitekit-typography--${ size }`
			);
		}
	);
} );
