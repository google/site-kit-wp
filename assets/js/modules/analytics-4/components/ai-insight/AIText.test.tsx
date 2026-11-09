/**
 * AIText component tests.
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
import { render } from '@tests/js/test-utils';
import AIText from './AIText';

describe( 'AIText', () => {
	it( 'should render text inside a `**` pair in a `strong` element', () => {
		const { container } = render(
			<AIText text="Sales are up by **50%**." />
		);

		expect( container.querySelector( 'strong' ) ).toHaveTextContent(
			/^50%$/
		);
		expect( container ).toHaveTextContent( 'Sales are up by 50%.' );
	} );

	it( 'should render HTML in the text as characters', () => {
		const { container } = render(
			<AIText text="Sales are up by <b>50%</b>." />
		);

		expect( container ).toHaveTextContent( 'Sales are up by <b>50%</b>.' );
		expect( container.querySelector( 'b' ) ).not.toBeInTheDocument();
	} );
} );
