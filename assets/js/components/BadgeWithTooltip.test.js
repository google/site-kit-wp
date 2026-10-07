/**
 * BadgeWithTooltip component tests.
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
import { BADGE_VARIANTS } from './Badge/constants';
import BadgeWithTooltip from './BadgeWithTooltip';

describe( 'BadgeWithTooltip', () => {
	it( 'renders the label with both base badge classes', () => {
		const { container, getByText } = render(
			<BadgeWithTooltip label="Partial data" />
		);

		expect( getByText( 'Partial data' ) ).toBeInTheDocument();
		expect( container.firstChild ).toHaveClass( 'googlesitekit-badge' );
		expect( container.firstChild ).toHaveClass(
			'googlesitekit-badge-with-tooltip'
		);
	} );

	it( 'falls back to the warning variant when no variant is given', () => {
		const { container } = render(
			<BadgeWithTooltip label="Partial data" />
		);

		expect( container.firstChild ).toHaveClass(
			'googlesitekit-badge--warning'
		);
	} );

	it( 'applies an explicit variant in place of the default', () => {
		const { container } = render(
			<BadgeWithTooltip
				label="New"
				variant={ BADGE_VARIANTS.ANNOUNCEMENT }
			/>
		);

		expect( container.firstChild ).toHaveClass(
			'googlesitekit-badge--announcement'
		);
		expect( container.firstChild ).not.toHaveClass(
			'googlesitekit-badge--warning'
		);
	} );

	it( 'renders the tooltip when a tooltip title is given', () => {
		const { container } = render(
			<BadgeWithTooltip
				label="Partial data"
				tooltipTitle="Data is incomplete"
			/>
		);

		expect(
			container.querySelector( '.googlesitekit-info-tooltip' )
		).toBeInTheDocument();
	} );

	it( 'renders no tooltip when no tooltip title is given', () => {
		const { container } = render(
			<BadgeWithTooltip label="Partial data" />
		);

		expect(
			container.querySelector( '.googlesitekit-info-tooltip' )
		).not.toBeInTheDocument();
	} );
} );
