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
import { fireEvent, render, screen, within } from '@tests/js/test-utils';
import CTAPreview from './index';

describe( 'CTAPreview', () => {
	it( 'should render the default title and description', () => {
		render( <CTAPreview /> );

		expect( screen.getByText( 'See how it looks' ) ).toBeInTheDocument();

		expect(
			screen.getByText(
				'The CTA will be implemented automatically as a pop-up. To display it inline, you will need to add a code snippet to the relevant page.'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the default footer disclaimer', () => {
		render( <CTAPreview /> );

		expect(
			screen.getByText(
				'Preview intended for visualization purpose only. Verify final appearance on your website.'
			)
		).toBeInTheDocument();
	} );

	it( 'should render custom title and description when provided', () => {
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

	it( 'should not render the footer when footer prop is empty', () => {
		const { container } = render( <CTAPreview footer="" /> );

		expect(
			container.querySelector( '.googlesitekit-rrm-cta-preview__footer' )
		).not.toBeInTheDocument();
	} );

	it( 'should render a custom footer when provided', () => {
		render( <CTAPreview footer="Custom disclaimer." /> );

		expect( screen.getByText( 'Custom disclaimer.' ) ).toBeInTheDocument();
	} );

	it( 'should render the popup panel with the shared content and popup background by default', () => {
		render(
			<CTAPreview>
				<div>Preview content</div>
			</CTAPreview>
		);

		expect( screen.getByRole( 'tab', { name: 'Pop-up' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);

		expect( screen.getByRole( 'tab', { name: 'Inline' } ) ).toHaveAttribute(
			'aria-selected',
			'false'
		);

		const panel = screen.getByRole( 'tabpanel', { name: 'Pop-up' } );

		expect( panel ).toHaveClass(
			'googlesitekit-rrm-cta-preview__panel--popup'
		);

		expect(
			screen.queryByRole( 'tabpanel', { name: 'Inline' } )
		).not.toBeInTheDocument();

		const content = within( panel ).getByText( 'Preview content' );
		const card = content.parentElement;

		expect( card ).toHaveClass(
			'googlesitekit-rrm-cta-preview__panel-card'
		);

		expect( panel.querySelectorAll( 'svg' ) ).toHaveLength( 1 );
		expect( card?.previousElementSibling?.tagName ).toBe( 'svg' );
		expect( card?.nextElementSibling ).toBeNull();
	} );

	it( 'should switch to the inline panel with the shared content between its images', () => {
		render(
			<CTAPreview>
				<div>Preview content</div>
			</CTAPreview>
		);

		fireEvent.click( screen.getByRole( 'tab', { name: 'Inline' } ) );

		expect( screen.getByRole( 'tab', { name: 'Inline' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);

		expect( screen.getByRole( 'tab', { name: 'Pop-up' } ) ).toHaveAttribute(
			'aria-selected',
			'false'
		);

		const panel = screen.getByRole( 'tabpanel', { name: 'Inline' } );

		expect( panel ).toHaveClass(
			'googlesitekit-rrm-cta-preview__panel--inline'
		);

		expect(
			screen.queryByRole( 'tabpanel', { name: 'Pop-up' } )
		).not.toBeInTheDocument();

		const content = within( panel ).getByText( 'Preview content' );
		const card = content.parentElement;

		expect( card ).toHaveClass(
			'googlesitekit-rrm-cta-preview__panel-card'
		);

		expect( panel.querySelectorAll( 'svg' ) ).toHaveLength( 2 );
		expect( card?.previousElementSibling?.tagName ).toBe( 'svg' );
		expect( card?.nextElementSibling?.tagName ).toBe( 'svg' );
	} );
} );
