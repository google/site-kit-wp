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
	it( 'should show the title as a heading', () => {
		const { getByRole } = render( <TypicalTrafficChartHeader /> );

		expect(
			getByRole( 'heading', {
				name: 'Your traffic compared to your expected range',
			} )
		).toBeInTheDocument();
	} );

	it( 'should show the tooltip text and a "Learn more" link to `#` when the info icon is hovered', async () => {
		const { container } = render( <TypicalTrafficChartHeader /> );

		fireEvent.mouseOver(
			container.querySelector( '.googlesitekit-info-tooltip' ) as Element
		);

		// The popup renders outside the header, at the end of the document.
		await waitFor( () => {
			expect(
				document.querySelector(
					'.googlesitekit-info-tooltip__content--typical-traffic'
				)
			).toHaveTextContent(
				'Site Kit analyzes the last 18 months of your traffic history to estimate a typical range, so you can see when visits are higher or lower than expected. Learn more'
			);
		} );

		expect(
			screen.getByRole( 'link', { name: /Learn more/ } )
		).toHaveAttribute( 'href', '#' );
	} );
} );
