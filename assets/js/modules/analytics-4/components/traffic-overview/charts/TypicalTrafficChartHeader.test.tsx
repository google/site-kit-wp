/**
 * TypicalTrafficChartHeader tests.
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
import { fireEvent, render, screen, waitFor } from '@tests/js/test-utils';
import TypicalTrafficChartHeader from './TypicalTrafficChartHeader';

describe( 'TypicalTrafficChartHeader', () => {
	it( 'should show "Your traffic compared to your typical range" as a heading', () => {
		const { getByRole } = render( <TypicalTrafficChartHeader /> );

		expect(
			getByRole( 'heading', {
				name: 'Your traffic compared to your typical range',
			} )
		).toBeInTheDocument();
	} );

	it( 'should show the tooltip text "to estimate a typical range" and a "Learn more" link to `#` when the info icon is hovered', async () => {
		const { container } = render( <TypicalTrafficChartHeader /> );

		// The popup renders outside the header, at the end of the document.
		expect(
			document.querySelector(
				'.googlesitekit-info-tooltip__content--typical-traffic'
			)
		).not.toBeInTheDocument();

		fireEvent.mouseOver(
			container.querySelector( '.googlesitekit-info-tooltip' ) as Element
		);

		await waitFor( () => {
			expect(
				document.querySelector(
					'.googlesitekit-info-tooltip__content--typical-traffic'
				)
			).toHaveTextContent( 'to estimate a typical range' );
		} );

		const learnMoreLink = screen.getByRole( 'link', {
			name: 'Learn more (opens in a new tab)',
		} );

		expect( learnMoreLink ).toHaveAttribute( 'href', '#' );
		expect( learnMoreLink ).toHaveAttribute( 'target', '_blank' );
		// The design shows no external link icon after "Learn more".
		expect( learnMoreLink.querySelector( 'svg' ) ).not.toBeInTheDocument();
	} );
} );
