/**
 * ReportErrorButton component tests.
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
 * External dependencies
 */
import { fireEvent, getByText, waitFor } from '@testing-library/dom';

/**
 * Internal dependencies
 */
import { render } from '../../../../tests/js/test-utils';
import ReportErrorButton from './';
import copyToClipboard from 'clipboard-copy';

jest.mock( 'clipboard-copy', () => jest.fn() );

describe( 'ReportErrorButton', () => {
	afterEach( () => {
		copyToClipboard.mockReset();
	} );

	it( 'should change copy error and change text ', async () => {
		const { container } = render(
			<ReportErrorButton
				message="Something bad happened. (On purpose)"
				componentStack="in ThrowErrorComponent"
			/>
		);

		expect(
			getByText( container, /Copy error contents/ )
		).toBeInTheDocument();

		fireEvent.click( container.querySelector( 'button' ) );

		await waitFor( () => {
			const counter = getByText( container, /Copied to clipboard/ );
			expect( counter ).toBeInTheDocument();
		} );

		expect( copyToClipboard ).toHaveBeenCalled();
	} );
} );
