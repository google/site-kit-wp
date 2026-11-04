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

	it.each( [
		[ 0, '0' ],
		[ 980, '980' ],
	] )(
		'shows the value and label with no change badge and no comparison label when the previous value is zero and the current value is %d',
		( currentValue, expectedValue ) => {
			const { container, getByText, queryByText } = render(
				<Tile
					{ ...baseProps }
					currentValue={ currentValue }
					previousValue={ 0 }
				/>
			);

			expect( getByText( expectedValue ) ).toBeInTheDocument();
			expect( getByText( 'Total submissions' ) ).toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).not.toBeInTheDocument();
			expect( queryByText( /Vs\. prev\./ ) ).not.toBeInTheDocument();
		}
	);

	it( 'shows the percentage change badge and comparison label when the previous value is above zero', () => {
		const { getByText } = render(
			<Tile
				{ ...baseProps }
				currentValue={ 1234 }
				previousValue={ 1100 }
			/>
		);

		expect( getByText( '+12.2%' ) ).toBeInTheDocument();
		expect( getByText( /Vs\. prev\./ ) ).toBeInTheDocument();
	} );

	it( 'renders the "No change" badge instead of "0%" when the current value equals the previous value and the previous value is above zero', () => {
		const { getByText, queryByText } = render(
			<Tile
				{ ...baseProps }
				currentValue={ 1000 }
				previousValue={ 1000 }
			/>
		);

		expect( getByText( 'No change' ) ).toBeInTheDocument();
		expect( queryByText( '0%' ) ).not.toBeInTheDocument();
	} );

	it( 'gives the primary tile the neutral background when the current value equals the previous value and the previous value is above zero', () => {
		const { container } = render(
			<Tile
				{ ...baseProps }
				currentValue={ 1000 }
				previousValue={ 1000 }
				primary
			/>
		);

		expect(
			container.querySelector(
				'.googlesitekit-site-goals-tile--primary__neutral'
			)
		).toBeInTheDocument();
	} );

	it( 'keeps the neutral background off a non-primary tile when the current value equals the previous value', () => {
		const { container } = render(
			<Tile
				{ ...baseProps }
				currentValue={ 1000 }
				previousValue={ 1000 }
			/>
		);

		expect(
			container.querySelector(
				'.googlesitekit-site-goals-tile--primary__neutral'
			)
		).not.toBeInTheDocument();
	} );

	it( 'keeps the neutral background off a primary tile when the previous value is zero', () => {
		const { container } = render(
			<Tile
				{ ...baseProps }
				currentValue={ 0 }
				previousValue={ 0 }
				primary
			/>
		);

		expect(
			container.querySelector(
				'.googlesitekit-site-goals-tile--primary__neutral'
			)
		).not.toBeInTheDocument();
	} );

	it( 'shows a -100% change badge when the previous value is above zero and the current value is zero', () => {
		const { getByText } = render(
			<Tile { ...baseProps } currentValue={ 0 } previousValue={ 1100 } />
		);

		expect( getByText( '-100%' ) ).toBeInTheDocument();
	} );
} );
