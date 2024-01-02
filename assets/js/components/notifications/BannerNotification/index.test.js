/**
 * BannerNotification component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { getByText } from '@testing-library/dom';

/**
 * Internal dependencies
 */
import BannerNotification from './index';
import {
	render,
	fireEvent,
	act,
	waitFor,
} from '../../../../../tests/js/test-utils';

// Mock `@wordpress/url` to return `true` for `isURL` when `#` is passed as a URL.
jest.mock( '@wordpress/url', () => ( {
	...jest.requireActual( '@wordpress/url' ),
	isURL: jest.fn().mockImplementation( ( url ) => url === '#' ),
} ) );
// Mock `invariant` to prevent it from throwing errors when `#` is passed as a URL.
jest.mock( 'invariant', () => jest.fn() );

describe( 'BannerNotification', () => {
	afterAll( () => {
		jest.restoreAllMocks();
	} );

	it( 'should wrap the description in a paragraph when the description is not a React element', () => {
		const { container } = render(
			<BannerNotification
				id="fake"
				title="Hey there!"
				description="I am string, not React element"
			/>
		);

		expect(
			getByText(
				container.querySelector(
					'.googlesitekit-publisher-win__desc > p'
				),
				/I am string, not React element/
			)
		).toBeInTheDocument();

		expect( container.querySelector( '.sk-react-element' ) ).toBeFalsy();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should not wrap the description in a paragraph when the description is a React element', () => {
		const { container } = render(
			<BannerNotification
				id="fake"
				title="Hey there!"
				description={
					<p className="sk-react-element">I am React element</p>
				}
			/>
		);

		expect(
			getByText(
				container.querySelector(
					'.googlesitekit-publisher-win__desc > .sk-react-element'
				),
				/I am React element/
			)
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should dismiss the notification when clicking on a CTA link and isDismissible is true', async () => {
		const { container, getByRole } = render(
			<div className="googlesitekit-dashboard">
				<h2>Site Kit Dashboard</h2>
				<BannerNotification
					id="fake"
					title="Hey there!"
					description="This is a test notification"
					ctaLink="#"
					ctaLabel="Click me"
					isDismissible
				/>
			</div>
		);

		expect(
			container.querySelector( '.googlesitekit-publisher-win' )
		).toBeInTheDocument();

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /click me/i } ) );
		} );

		await waitFor( () => {
			// Verify dashboard is still in the DOM
			expect(
				container.querySelector( '.googlesitekit-dashboard' )
			).toBeInTheDocument();
			// Verify notification is no longer in the DOM
			expect(
				container.querySelector( '.googlesitekit-publisher-win' )
			).not.toBeInTheDocument();
		} );
	} );
} );
