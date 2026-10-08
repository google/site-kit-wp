/**
 * Badge component tests.
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
import { BADGE_VARIANTS } from './constants';
import Badge from './index';

describe( 'Badge', () => {
	it( 'renders the label', () => {
		const { getByText } = render( <Badge label="Beta" /> );

		expect( getByText( 'Beta' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ BADGE_VARIANTS.ANNOUNCEMENT, 'googlesitekit-badge--announcement' ],
		[
			BADGE_VARIANTS.RECOMMENDATION,
			'googlesitekit-badge--recommendation',
		],
		[ BADGE_VARIANTS.COST, 'googlesitekit-badge--cost' ],
		[ BADGE_VARIANTS.EXPERIMENTAL, 'googlesitekit-badge--experimental' ],
		[ BADGE_VARIANTS.WARNING, 'googlesitekit-badge--warning' ],
	] )(
		'applies the modifier class for the %s variant',
		( variant, expected ) => {
			const { container } = render(
				<Badge label="Badge" variant={ variant } />
			);

			expect( container.firstChild ).toHaveClass( 'googlesitekit-badge' );
			expect( container.firstChild ).toHaveClass( expected );
		}
	);

	it( 'applies no variant class when no variant is given', () => {
		const { container } = render( <Badge label="Badge" /> );
		const badge = container.querySelector( 'span' );

		expect( badge ).toHaveClass( 'googlesitekit-badge' );
		expect( badge?.className ).not.toContain( 'googlesitekit-badge--' );
	} );

	it( 'applies a caller-supplied className alongside the variant class', () => {
		const { container } = render(
			<Badge
				label="Badge"
				className="custom-badge-class"
				variant={ BADGE_VARIANTS.WARNING }
			/>
		);

		expect( container.firstChild ).toHaveClass( 'custom-badge-class' );
		expect( container.firstChild ).toHaveClass(
			'googlesitekit-badge--warning'
		);
	} );

	it( 'applies the left spacing class when hasLeftSpacing is set', () => {
		const { container } = render( <Badge label="Badge" hasLeftSpacing /> );

		expect( container.firstChild ).toHaveClass(
			'googlesitekit-badge--has-left-spacing'
		);
	} );
} );
