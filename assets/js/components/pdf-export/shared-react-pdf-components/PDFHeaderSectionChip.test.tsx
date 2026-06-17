/**
 * PDFHeaderSectionChip tests.
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
import { Path, Svg } from '@react-pdf/renderer';

/**
 * Internal dependencies
 */
import { render } from '@tests/js/test-utils';
import PDFHeaderSectionChip from './PDFHeaderSectionChip';

function FakeIcon() {
	return (
		<Svg width={ 12 } height={ 12 } viewBox="0 0 20 20">
			<Path d="M0 0H20V20H0Z" fill="#000000" />
		</Svg>
	);
}

describe( 'PDFHeaderSectionChip', () => {
	it( 'renders the icon and the label', () => {
		const { container, getByText } = render(
			<PDFHeaderSectionChip label="Traffic" Icon={ FakeIcon } />
		);

		expect( getByText( 'Traffic' ) ).toBeInTheDocument();
		expect( container.querySelector( 'pdf-svg' ) ).toBeInTheDocument();
	} );

	it( 'renders an inert chip with no link target yet (#12553 wires the anchor)', () => {
		const { container, getByText } = render(
			<PDFHeaderSectionChip label="Traffic" Icon={ FakeIcon } />
		);

		// The chip is a plain pill until #12553 adds the section anchor, so it
		// must not emit a (srcless) link annotation.
		expect( container.querySelector( 'pdf-link' ) ).not.toBeInTheDocument();
		expect( getByText( 'Traffic' ) ).toBeInTheDocument();
	} );

	it( 'renders the label without an icon when none is supplied', () => {
		const { container, getByText } = render(
			<PDFHeaderSectionChip label="Traffic" />
		);

		expect( getByText( 'Traffic' ) ).toBeInTheDocument();
		expect( container.querySelector( 'pdf-svg' ) ).not.toBeInTheDocument();
	} );
} );
