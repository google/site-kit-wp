/**
 * Tile component tests.
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
import { Tile, TileProps } from './Tile';

describe( 'Tile', () => {
	const baseProps: Pick< TileProps, 'title' | 'subtitle' | 'format' > = {
		title: 'Form Submissions',
		subtitle: 'Total submissions',
		format: { style: 'decimal' },
	};

	it.each( [ 0, 980 ] )(
		'hides the change badge and comparison label when the previous value is zero and the current value is %d',
		( currentValue ) => {
			const { container, queryByText } = render(
				<Tile
					{ ...baseProps }
					currentValue={ currentValue }
					previousValue={ 0 }
				/>
			);

			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).not.toBeInTheDocument();
			expect( queryByText( /Vs\. prev\./ ) ).not.toBeInTheDocument();
		}
	);

	it( 'shows the change badge and comparison label when the previous value is above zero', () => {
		const { container, getByText } = render(
			<Tile
				{ ...baseProps }
				currentValue={ 1234 }
				previousValue={ 1100 }
			/>
		);

		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toBeInTheDocument();
		expect( getByText( /Vs\. prev\./ ) ).toBeInTheDocument();
	} );

	it( 'shows a 0% change badge when the previous value is above zero and the values are equal', () => {
		const { getByText } = render(
			<Tile
				{ ...baseProps }
				currentValue={ 1000 }
				previousValue={ 1000 }
			/>
		);

		expect( getByText( '0%' ) ).toBeInTheDocument();
	} );
} );
