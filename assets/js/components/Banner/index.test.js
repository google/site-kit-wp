/**
 * Banner component tests.
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
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { render } from '../../../../tests/js/test-utils';
import Banner from './index';

describe( 'Banner', () => {
	describe( 'description prop', () => {
		it( 'renders string description correctly', () => {
			const { getByText, container } = render(
				<Banner
					title="Test Banner"
					description="This is a test description with <strong>bold text</strong> and <em>italic text</em>."
				/>
			);

			expect( getByText( 'Test Banner' ) ).toBeInTheDocument();
			expect(
				getByText( /This is a test description with/ )
			).toBeInTheDocument();
			expect( getByText( 'bold text' ) ).toBeInTheDocument();
			expect( getByText( 'italic text' ) ).toBeInTheDocument();

			// Check that the strong and em tags are properly rendered.
			const strong = container.querySelector( 'strong' );
			const em = container.querySelector( 'em' );

			expect( strong ).toBeInTheDocument();
			expect( strong ).toHaveTextContent( 'bold text' );
			expect( em ).toBeInTheDocument();
			expect( em ).toHaveTextContent( 'italic text' );
		} );

		it( 'renders component-based description correctly', () => {
			const TestComponent = () =>
				createElement(
					'div',
					{ className: 'test-component' },
					'Component description'
				);

			const { getByText, container } = render(
				<Banner
					title="Test Banner"
					description={ createElement( TestComponent ) }
				/>
			);

			expect( getByText( 'Test Banner' ) ).toBeInTheDocument();
			expect( getByText( 'Component description' ) ).toBeInTheDocument();
			expect(
				container.querySelector( '.test-component' )
			).toBeInTheDocument();
		} );

		it( 'renders both string and component descriptions when both are provided', () => {
			const TestComponent = () =>
				createElement(
					'div',
					{ className: 'additional-component' },
					'Additional info'
				);

			const { getByText, container } = render(
				<Banner
					title="Test Banner"
					description="Main description"
					additionalDescription={ createElement( TestComponent ) }
				/>
			);

			expect( getByText( 'Test Banner' ) ).toBeInTheDocument();
			expect( getByText( 'Main description' ) ).toBeInTheDocument();
			expect( getByText( 'Additional info' ) ).toBeInTheDocument();
			expect(
				container.querySelector( '.additional-component' )
			).toBeInTheDocument();
		} );

		it( 'handles HTML tags in string description safely', () => {
			const { getByText, container } = render(
				<Banner
					title="Test Banner"
					description="Description with <a href='https://example.com'>link</a> and <br>break"
				/>
			);

			expect( getByText( 'Test Banner' ) ).toBeInTheDocument();
			expect( getByText( /Description with/ ) ).toBeInTheDocument();
			expect( getByText( 'link' ) ).toBeInTheDocument();
			expect( getByText( /break/ ) ).toBeInTheDocument();

			// Check that the link is properly rendered.
			const link = container.querySelector(
				'a[href="https://example.com"]'
			);
			expect( link ).toBeInTheDocument();
			expect( link ).toHaveTextContent( 'link' );
		} );

		it( 'renders without description when not provided', () => {
			const { getByText, queryByText } = render(
				<Banner title="Test Banner" />
			);

			expect( getByText( 'Test Banner' ) ).toBeInTheDocument();
			expect( queryByText( /description/i ) ).not.toBeInTheDocument();
		} );

		it( 'renders LearnMoreLink when learnMoreLink prop is provided', () => {
			const { getByText, container } = render(
				<Banner
					title="Test Banner"
					description="Test description"
					learnMoreLink={ {
						href: 'https://example.com/learn-more',
						label: 'Learn more about this',
						external: true,
					} }
				/>
			);

			expect( getByText( 'Test Banner' ) ).toBeInTheDocument();
			expect( getByText( 'Test description' ) ).toBeInTheDocument();
			expect( getByText( 'Learn more about this' ) ).toBeInTheDocument();

			// Check that the link is properly rendered with correct attributes.
			const link = container.querySelector(
				'a[href="https://example.com/learn-more"]'
			);
			expect( link ).toBeInTheDocument();
			expect( link ).toHaveTextContent( 'Learn more about this' );
			expect( link ).toHaveAttribute( 'target', '_blank' );
			expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
		} );

		it( 'renders LearnMoreLink with default label when only href is provided', () => {
			const { getByText, container } = render(
				<Banner
					title="Test Banner"
					description="Test description"
					learnMoreLink={ {
						href: 'https://example.com/learn-more',
					} }
				/>
			);

			expect( getByText( 'Test Banner' ) ).toBeInTheDocument();
			expect( getByText( 'Test description' ) ).toBeInTheDocument();
			expect( getByText( 'Learn more' ) ).toBeInTheDocument();

			// Check that the link is properly rendered.
			const link = container.querySelector(
				'a[href="https://example.com/learn-more"]'
			);
			expect( link ).toBeInTheDocument();
			expect( link ).toHaveTextContent( 'Learn more' );
		} );
	} );

	describe( 'basic rendering', () => {
		it( 'renders with required props', () => {
			const { getByText, container } = render(
				<Banner title="Test Banner" description="Test description" />
			);

			expect( container.firstChild ).toHaveClass(
				'googlesitekit-banner'
			);
			expect( getByText( 'Test Banner' ) ).toBeInTheDocument();
			expect( getByText( 'Test description' ) ).toBeInTheDocument();
		} );

		it( 'applies custom className', () => {
			const { container } = render(
				<Banner
					title="Test Banner"
					description="Test description"
					className="custom-class"
				/>
			);

			expect( container.firstChild ).toHaveClass(
				'googlesitekit-banner'
			);
			expect( container.firstChild ).toHaveClass( 'custom-class' );
		} );
	} );
} );
