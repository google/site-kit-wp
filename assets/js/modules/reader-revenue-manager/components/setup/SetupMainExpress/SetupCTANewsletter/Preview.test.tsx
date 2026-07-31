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
import { fireEvent, render, screen } from '@tests/js/test-utils';
import InlinePane from './InlinePane';
import PopupPane from './PopupPane';
import Preview from './Preview';

describe( 'Preview', () => {
	it( 'should render the CTAPreview shell with default heading and description', () => {
		render( <Preview /> );

		expect( screen.getByText( 'See how it looks' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'The CTA will be implemented automatically as a pop-up. To display it inline, you will need to add a code snippet to the relevant page.'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the Pop-up and Inline tabs', () => {
		render( <Preview /> );

		expect(
			screen.getByRole( 'tab', { name: /pop-up/i } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'tab', { name: /inline/i } )
		).toBeInTheDocument();
	} );

	it( 'should render popup pane content by default', () => {
		render( <Preview ctaTitle="My Newsletter" ctaBody="Sign up today." /> );

		// Popup tab is active by default, popup content should be visible.
		const panels = screen.getAllByText( 'My Newsletter' );
		expect( panels[ 0 ] ).toBeInTheDocument();
	} );

	it( 'should show inline pane content when the Inline tab is clicked', () => {
		render(
			<Preview
				ctaTitle="My Newsletter"
				ctaBody="Sign up today."
				consentEnabled={ false }
			/>
		);

		const inlineTab = screen.getByRole( 'tab', { name: /inline/i } );
		fireEvent.click( inlineTab );

		// Both popup and inline panes share the same content so verify rendering.
		expect( screen.getByText( 'My Newsletter' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Sign up today.' ) ).toBeInTheDocument();
	} );

	it( 'should not render CTA title and body when not provided', () => {
		render( <Preview /> );

		// Default state has no ctaTitle or ctaBody props.
		expect(
			screen.queryByRole( 'heading', { name: /your form header/i } )
		).not.toBeInTheDocument();
	} );
} );

describe( 'PopupPane', () => {
	it( 'should render the publication name label', () => {
		render( <PopupPane /> );

		expect( screen.getByText( 'Publication name' ) ).toBeInTheDocument();
	} );

	it( 'should render CTA title when provided', () => {
		render( <PopupPane ctaTitle="Your form header" /> );

		expect( screen.getByText( 'Your form header' ) ).toBeInTheDocument();
	} );

	it( 'should render CTA body when provided', () => {
		render( <PopupPane ctaBody="Your newsletter sign-up form text" /> );

		expect(
			screen.getByText( 'Your newsletter sign-up form text' )
		).toBeInTheDocument();
	} );

	it( 'should not render the consent row when consentEnabled is false', () => {
		render( <PopupPane consentEnabled={ false } /> );

		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	it( 'should render the consent row when consentEnabled is true', () => {
		render(
			<PopupPane
				consentText="Your consent text will show here"
				consentEnabled
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Your consent text will show here' )
		).toBeInTheDocument();
	} );

	it( 'should render the default consent text when consentEnabled is true but no consentText is given', () => {
		render( <PopupPane consentEnabled /> );

		expect(
			screen.getByText( 'Your consent text will show here' )
		).toBeInTheDocument();
	} );

	it( 'should render the disabled Continue with email button', () => {
		render( <PopupPane /> );

		const button = screen.getByRole( 'button', {
			name: /continue with email/i,
		} );
		expect( button ).toBeDisabled();
	} );

	it( 'should render the disabled Continue with Google button', () => {
		render( <PopupPane /> );

		const button = screen.getByRole( 'button', {
			name: /continue with google/i,
		} );
		expect( button ).toBeDisabled();
	} );

	it( 'should render the disclaimer text with non-functional link spans', () => {
		render( <PopupPane /> );

		// Verify "Terms of Service" link span is present.
		expect( screen.getByText( 'Terms of Service' ) ).toBeInTheDocument();
		// Verify "Privacy Policy" link span is present.
		expect( screen.getByText( 'Privacy Policy' ) ).toBeInTheDocument();
		// Verify disclaimer links are rendered as spans (non-functional).
		const tos = screen.getByText( 'Terms of Service' );
		expect( tos.tagName ).toBe( 'SPAN' );
		const pp = screen.getByText( 'Privacy Policy' );
		expect( pp.tagName ).toBe( 'SPAN' );
	} );
} );

describe( 'InlinePane', () => {
	it( 'should render the publication name label', () => {
		render( <InlinePane /> );

		expect( screen.getByText( 'Publication name' ) ).toBeInTheDocument();
	} );

	it( 'should render CTA title when provided', () => {
		render( <InlinePane ctaTitle="Your form header" /> );

		expect( screen.getByText( 'Your form header' ) ).toBeInTheDocument();
	} );

	it( 'should render CTA body when provided', () => {
		render( <InlinePane ctaBody="Your newsletter sign-up form text" /> );

		expect(
			screen.getByText( 'Your newsletter sign-up form text' )
		).toBeInTheDocument();
	} );

	it( 'should not render the consent row when consentEnabled is false', () => {
		render( <InlinePane consentEnabled={ false } /> );

		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	it( 'should render the consent row when consentEnabled is true', () => {
		render(
			<InlinePane
				consentText="Your consent text will show here"
				consentEnabled
			/>
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Your consent text will show here' )
		).toBeInTheDocument();
	} );

	it( 'should render the disabled Continue with email button', () => {
		render( <InlinePane /> );

		const button = screen.getByRole( 'button', {
			name: /continue with email/i,
		} );
		expect( button ).toBeDisabled();
	} );

	it( 'should render the disabled Continue with Google button', () => {
		render( <InlinePane /> );

		const button = screen.getByRole( 'button', {
			name: /continue with google/i,
		} );
		expect( button ).toBeDisabled();
	} );

	it( 'should render the disclaimer text with non-functional link spans', () => {
		render( <InlinePane /> );

		const tos = screen.getByText( 'Terms of Service' );
		expect( tos.tagName ).toBe( 'SPAN' );
		const pp = screen.getByText( 'Privacy Policy' );
		expect( pp.tagName ).toBe( 'SPAN' );
	} );
} );
