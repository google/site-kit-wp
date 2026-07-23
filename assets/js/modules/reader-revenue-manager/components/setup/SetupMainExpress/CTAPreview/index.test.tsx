/**
 * Reader Revenue Manager CTAPreview component tests.
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
import CTAPreview from './index';

describe( 'CTAPreview', () => {
	it( 'renders the default title and description', () => {
		render( <CTAPreview /> );

		expect( screen.getByText( 'See how it looks' ) ).toBeInTheDocument();

		expect(
			screen.getByText(
				'The CTA will be implemented automatically as a pop-up. To display it inline, you will need to add a code snippet to the relevant page.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the default footer disclaimer', () => {
		render( <CTAPreview /> );

		expect(
			screen.getByText(
				'Preview intended for visualization purpose only. Verify final appearance on your website.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders custom title and description when provided', () => {
		render(
			<CTAPreview
				title="Custom Title"
				description="Custom description text."
			/>
		);

		expect( screen.getByText( 'Custom Title' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Custom description text.' )
		).toBeInTheDocument();
	} );

	it( 'renders the Pop-up and Inline tabs', () => {
		render( <CTAPreview /> );

		expect(
			screen.getByRole( 'tab', { name: /pop-up/i } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'tab', { name: /inline/i } )
		).toBeInTheDocument();
	} );

	it( 'shows popup content by default', () => {
		render(
			<CTAPreview
				popupContent={ <div>Popup panel content</div> }
				inlineContent={ <div>Inline panel content</div> }
			/>
		);

		expect( screen.getByText( 'Popup panel content' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Inline panel content' )
		).not.toBeInTheDocument();
	} );

	it( 'shows inline content when the Inline tab is clicked', () => {
		render(
			<CTAPreview
				popupContent={ <div>Popup panel content</div> }
				inlineContent={ <div>Inline panel content</div> }
			/>
		);

		const inlineTab = screen.getByRole( 'tab', { name: /inline/i } );
		fireEvent.click( inlineTab );

		expect(
			screen.getByText( 'Inline panel content' )
		).toBeInTheDocument();
		expect(
			screen.queryByText( 'Popup panel content' )
		).not.toBeInTheDocument();
	} );

	it( 'renders the popup panel with the correct class', () => {
		const { container } = render(
			<CTAPreview popupContent={ <div>Popup content</div> } />
		);

		expect(
			container.querySelector(
				'.googlesitekit-rrm-cta-preview__panel--popup'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the inline panel with the correct class after switching tabs', () => {
		const { container } = render(
			<CTAPreview inlineContent={ <div>Inline content</div> } />
		);

		const inlineTab = screen.getByRole( 'tab', { name: /inline/i } );
		fireEvent.click( inlineTab );

		expect(
			container.querySelector(
				'.googlesitekit-rrm-cta-preview__panel--inline'
			)
		).toBeInTheDocument();
	} );

	it( 'does not render the footer when footer prop is empty', () => {
		const { container } = render( <CTAPreview footer="" /> );

		expect(
			container.querySelector( '.googlesitekit-rrm-cta-preview__footer' )
		).not.toBeInTheDocument();
	} );

	it( 'renders a custom footer when provided', () => {
		render( <CTAPreview footer="Custom disclaimer." /> );

		expect( screen.getByText( 'Custom disclaimer.' ) ).toBeInTheDocument();
	} );
} );
