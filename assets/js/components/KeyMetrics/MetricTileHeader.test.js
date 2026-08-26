/**
 * MetricTileHeader component tests.
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
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
	waitFor,
	within,
} from '@tests/js/test-utils';
import MetricTileHeader from './MetricTileHeader';

describe( 'MetricTileHeader', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	async function openTooltip( container ) {
		const infoTooltip = container.querySelector(
			'.googlesitekit-info-tooltip'
		);

		expect( infoTooltip ).toBeInTheDocument();

		fireEvent.mouseOver( infoTooltip );

		await waitFor( () => {
			expect(
				document.querySelector( '.googlesitekit-info-tooltip__content' )
			).toBeInTheDocument();
		} );

		return document.querySelector( '.googlesitekit-info-tooltip__content' );
	}

	it( 'should render the info tooltip as unchanged plain text when there is no documentation slug', async () => {
		const { container, getByText } = render(
			<MetricTileHeader
				title="Sales by countries"
				infoTooltip="Which countries bring in the most buyers?"
			/>,
			{ registry }
		);

		const tooltipContent = await openTooltip( container );

		expect(
			within( tooltipContent ).getByText(
				'Which countries bring in the most buyers?'
			)
		).toBeInTheDocument();
		expect(
			within( tooltipContent ).queryByRole( 'link' )
		).not.toBeInTheDocument();

		expect( getByText( 'Sales by countries' ) ).toBeInTheDocument();
	} );

	it( 'should append a working "Learn more" link when a documentation slug is provided', async () => {
		const { container } = render(
			<MetricTileHeader
				title="Sales rate"
				infoTooltip="The percentage of total visitors who successfully completed a key action, like making a purchase"
				documentationLinkSlug="site-goals-online-store-key-action"
			/>,
			{ registry }
		);

		const tooltipContent = await openTooltip( container );

		expect(
			within( tooltipContent ).getByText(
				'The percentage of total visitors who successfully completed a key action, like making a purchase',
				{ exact: false }
			)
		).toBeInTheDocument();

		const learnMoreLink = within( tooltipContent ).getByRole( 'link', {
			name: /Learn more/,
		} );

		expect( learnMoreLink ).toBeInTheDocument();
		expect( learnMoreLink.getAttribute( 'href' ) ).toEqual(
			expect.stringContaining( 'doc=site-goals-online-store-key-action' )
		);
	} );
} );
