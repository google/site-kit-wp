/**
 * PDFWidgetSection tests.
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
 * External dependencies
 */
import { Text } from '@react-pdf/renderer';

/**
 * Internal dependencies
 */
import { render } from '@tests/js/test-utils';
import PDFWidgetSection from './PDFWidgetSection';

describe( 'PDFWidgetSection', () => {
	it( 'renders the heading and children', () => {
		const { getByText } = render(
			<PDFWidgetSection heading="Your site traffic over time">
				<Text>child content</Text>
			</PDFWidgetSection>
		);

		expect(
			getByText( 'Your site traffic over time' )
		).toBeInTheDocument();
		expect( getByText( 'child content' ) ).toBeInTheDocument();
	} );

	it( 'renders children without a heading', () => {
		const { getByText, queryByText } = render(
			<PDFWidgetSection>
				<Text>only child</Text>
			</PDFWidgetSection>
		);

		expect( getByText( 'only child' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Your site traffic over time' )
		).not.toBeInTheDocument();
	} );
} );
