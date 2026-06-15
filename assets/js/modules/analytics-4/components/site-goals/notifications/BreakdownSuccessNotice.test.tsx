/**
 * Site Goals BreakdownSuccessNotice tests.
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
import { createTestRegistry } from '@tests/js/utils';
import BreakdownSuccessNotice from './BreakdownSuccessNotice';

describe( 'BreakdownSuccessNotice', () => {
	it( 'renders the lead generation copy supplied by the parent', () => {
		const { getByText } = render(
			<BreakdownSuccessNotice
				title="Success! Individual form tracking is now active"
				description="Site Kit is now tracking data for each of your forms individually."
				onDismiss={ () => {} }
			/>,
			{ registry: createTestRegistry() }
		);

		expect(
			getByText( /Individual form tracking is now active/ )
		).toBeInTheDocument();
		expect( getByText( /each of your forms/ ) ).toBeInTheDocument();
	} );

	it( 'renders the ecommerce copy supplied by the parent', () => {
		const { getByText } = render(
			<BreakdownSuccessNotice
				title="Success! Event breakdown is now active"
				description="Site Kit is now tracking your plugins individually."
				onDismiss={ () => {} }
			/>,
			{ registry: createTestRegistry() }
		);

		expect(
			getByText( /Event breakdown is now active/ )
		).toBeInTheDocument();
	} );

	it( 'invokes onDismiss when "Got it" is clicked', () => {
		const onDismiss = jest.fn();

		const { getByText } = render(
			<BreakdownSuccessNotice
				title="Title"
				description="Description"
				onDismiss={ onDismiss }
			/>,
			{ registry: createTestRegistry() }
		);

		fireEvent.click( getByText( 'Got it' ) );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
