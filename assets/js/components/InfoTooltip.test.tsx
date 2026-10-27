/**
 * InfoTooltip component tests.
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
import { act, fireEvent, render } from '@tests/js/test-utils';
import InfoTooltip from './InfoTooltip';

describe( 'InfoTooltip', () => {
	it( 'should name the info icon with the tooltip text before the tooltip opens', () => {
		const { getByRole } = render(
			<InfoTooltip title="The share of visitors who completed a key action." />
		);

		expect(
			getByRole( 'button', {
				name: 'The share of visitors who completed a key action.',
			} )
		).toBeInTheDocument();
	} );

	it( 'should take the info icon\'s name from tooltip text that includes a "Learn more" link', () => {
		const { getByRole } = render(
			<InfoTooltip
				title={
					<span>
						Visitors who completed a key action.{ ' ' }
						<a href="https://example.com">Learn more</a>
					</span>
				}
			/>
		);

		expect( getByRole( 'button' ) ).toHaveAccessibleName(
			'Visitors who completed a key action. Learn more'
		);
	} );

	it.each( [
		[ 'hovers over', fireEvent.mouseOver ],
		[
			'focuses',
			// `Tooltip` opens only when the icon matches `:focus-visible`, which
			// needs real focus, so a focus event alone does not open it.
			( element: HTMLElement ) => act( () => element.focus() ), // eslint-disable-line sitekit/acronym-case
		],
	] )(
		'should keep the tooltip text out of sight until a person %s the info icon',
		async ( _, showTooltip ) => {
			const { findByRole, getByRole, getByText, queryByRole } = render(
				<InfoTooltip title="The share of visitors who completed a key action." />
			);

			expect( queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
			expect(
				getByText( 'The share of visitors who completed a key action.' )
			).not.toBeVisible();

			showTooltip( getByRole( 'button' ) );

			expect( await findByRole( 'tooltip' ) ).toHaveTextContent(
				'The share of visitors who completed a key action.'
			);
		}
	);

	it( 'should not add the tooltip text as a description of the info icon', async () => {
		const { findByRole, getByRole } = render(
			<InfoTooltip title="The share of visitors who completed a key action." />
		);

		const infoIcon = getByRole( 'button' );

		expect( infoIcon ).not.toHaveAttribute( 'title' );

		act( () => infoIcon.focus() );

		await findByRole( 'tooltip' );

		expect( infoIcon ).toHaveAccessibleName(
			'The share of visitors who completed a key action.'
		);
		expect( infoIcon ).not.toHaveAttribute( 'aria-describedby' );
	} );

	it( 'should render nothing when there is no tooltip text', () => {
		const { container } = render( <InfoTooltip title="" /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
