/**
 * MediaErrorHandler component tests.
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
import MediaErrorHandler from './';
import { render } from '../../../../tests/js/test-utils';
import ThrowErrorComponent from '../../../../tests/js/ThrowErrorComponent';

describe( 'Media Error Handler', () => {
	it( 'should render error message when there is an error', () => {
		const { container } = render(
			<MediaErrorHandler>
				<ThrowErrorComponent throwErrorOnMount />
			</MediaErrorHandler>
		);

		expect( console ).toHaveErrored();

		expect(
			getByText( container, /Error: Failed to load media/ )
		).toBeInTheDocument();
	} );

	it( 'should render defined error message when there is an error', () => {
		const { container } = render(
			<MediaErrorHandler errorMessage="Failed to load graphic.">
				<ThrowErrorComponent throwErrorOnMount />
			</MediaErrorHandler>
		);

		expect( console ).toHaveErrored();

		expect(
			getByText( container, /Error: Failed to load graphic/ )
		).toBeInTheDocument();
	} );

	it( 'should render children if there is no error', () => {
		const { container } = render(
			<MediaErrorHandler>No errors encountered</MediaErrorHandler>
		);

		expect( console ).not.toHaveErrored();

		expect(
			getByText( container, /No errors encountered/ )
		).toBeInTheDocument();
	} );
} );
