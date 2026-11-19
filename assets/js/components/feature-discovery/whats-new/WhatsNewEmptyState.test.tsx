/**
 * WhatsNewEmptyState component tests.
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
import { fireEvent, render } from '@tests/js/test-utils';
import WhatsNewEmptyState from './WhatsNewEmptyState';

describe( 'WhatsNewEmptyState', () => {
	it( 'should render the empty state content', () => {
		const { getByRole, getByText } = render(
			<WhatsNewEmptyState onClickEmpty={ () => {} } />
		);

		expect(
			getByRole( 'heading', { name: 'You’re up to date!' } )
		).toBeInTheDocument();

		expect(
			getByText(
				'There are no new feature announcements right now, but you can explore other features that will help you grow your site'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Explore features' } )
		).toBeInTheDocument();
	} );

	it( 'should call onClickEmpty when Explore features is clicked', () => {
		const onClickEmpty = jest.fn();

		const { getByRole } = render(
			<WhatsNewEmptyState onClickEmpty={ onClickEmpty } />
		);

		fireEvent.click( getByRole( 'button', { name: 'Explore features' } ) );

		expect( onClickEmpty ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should forward its ref to the outer element', () => {
		const ref = { current: null };

		const { container } = render(
			<WhatsNewEmptyState ref={ ref } onClickEmpty={ () => {} } />
		);

		expect( ref.current ).toBe( container.firstChild );
	} );
} );
