/**
 * Reader Revenue Manager Newsletter CTA Preview component tests.
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
import { render, screen } from '@tests/js/test-utils';
import Preview from './index';

const defaultProps = {
	publicationName: 'Example Publication',
	ctaTitle: 'Get our newsletter',
	ctaBody: 'The latest stories in your inbox.',
};

describe( 'Newsletter Preview', () => {
	it( 'should render the title and body from props', () => {
		render( <Preview { ...defaultProps } /> );

		expect(
			screen.getByRole( 'heading', { name: defaultProps.ctaTitle } )
		).toBeInTheDocument();

		expect( screen.getByText( defaultProps.ctaBody ) ).toBeInTheDocument();
	} );

	it( 'should render the publication name in the header and disclaimer', () => {
		render( <Preview { ...defaultProps } /> );

		expect(
			screen.getByText( defaultProps.publicationName, { exact: true } )
		).toBeInTheDocument();

		const disclaimer = screen.getByText( /By continuing, you agree/ );

		expect( disclaimer ).toHaveTextContent(
			'to Example Publication through a Google service.'
		);

		expect( disclaimer ).toHaveTextContent(
			'Example Publication’s use of your data is subject to their own terms and privacy policy.'
		);

		expect(
			screen.queryByText( 'Publication name' )
		).not.toBeInTheDocument();
	} );

	it( 'should use the placeholder publication name in the disclaimer when none is supplied', () => {
		render( <Preview { ...defaultProps } publicationName={ undefined } /> );

		expect(
			screen.getByText( /By continuing, you agree/ )
		).toHaveTextContent( 'to Publication name through a Google service.' );
	} );

	it.each( [ undefined, '' ] )(
		'should omit the title when it is %s',
		( ctaTitle ) => {
			render( <Preview { ...defaultProps } ctaTitle={ ctaTitle } /> );

			expect( screen.queryByRole( 'heading' ) ).not.toBeInTheDocument();
			expect(
				screen.getByText( defaultProps.ctaBody )
			).toBeInTheDocument();
		}
	);

	it.each( [ undefined, '' ] )(
		'should omit the body when it is %s',
		( ctaBody ) => {
			render( <Preview { ...defaultProps } ctaBody={ ctaBody } /> );

			expect(
				screen.queryByText( defaultProps.ctaBody )
			).not.toBeInTheDocument();

			expect(
				screen.getByRole( 'heading', { name: defaultProps.ctaTitle } )
			).toBeInTheDocument();
		}
	);

	it.each( [ undefined, false ] )(
		'should omit consent when consentEnabled is %s',
		( consentEnabled ) => {
			render(
				<Preview
					{ ...defaultProps }
					consentEnabled={ consentEnabled }
					consentText="I agree to receive updates."
				/>
			);

			expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();

			expect(
				screen.queryByText( 'I agree to receive updates.' )
			).not.toBeInTheDocument();
		}
	);

	it( 'should render the consent text with a disabled, unchecked checkbox when enabled', () => {
		render(
			<Preview
				{ ...defaultProps }
				consentText="I agree to receive updates."
				consentEnabled
			/>
		);

		const checkbox = screen.getByRole( 'checkbox', {
			name: 'I agree to receive updates.',
		} );

		expect( checkbox ).toBeDisabled();
		expect( checkbox ).not.toBeChecked();
	} );

	it( 'should render the placeholder consent text when no consent text is supplied', () => {
		render( <Preview { ...defaultProps } consentEnabled /> );

		expect(
			screen.getByRole( 'checkbox', {
				name: 'Your consent text will show here',
			} )
		).toBeDisabled();
	} );

	it.each( [ 'Continue with email', 'Continue with Google' ] )(
		'should disable the %s button',
		( name ) => {
			render( <Preview { ...defaultProps } /> );

			expect( screen.getByRole( 'button', { name } ) ).toBeDisabled();
		}
	);

	it( 'should render disclaimer links as non-interactive spans', () => {
		render( <Preview { ...defaultProps } /> );

		[
			'Terms of Service',
			'Privacy Policy',
			'terms',
			'privacy policy',
		].forEach( ( text ) => {
			const link = screen.getByText( text, { exact: true } );

			expect( link.tagName ).toBe( 'SPAN' );

			expect( link ).toHaveClass(
				'googlesitekit-rrm-cta-preview-pane__link'
			);

			expect( link ).not.toHaveAttribute( 'href' );
		} );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
