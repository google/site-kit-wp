/**
 * Key action tiles tests.
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
import KeyActionTiles from './KeyActionTiles';

describe( 'KeyActionTiles', () => {
	const props = {
		supportURL: 'https://example.com/help',
		rateTitle: 'Sales Rate',
		totalTitle: 'Total Sales',
		totalSubtitle: '“purchase” events',
		currentRate: 0.5,
		previousRate: 0.4,
		currentSessions: 100,
		currentCount: 42,
		previousCount: 30,
		otherSourcesCount: 7,
		otherSourcesPreviousCount: 3,
	};

	it( 'renders the rate and total tiles, using the value-tab count, on a value tab', () => {
		const { getByText, queryByText } = render(
			<KeyActionTiles { ...props } isOtherSourcesTab={ false } />
		);

		expect( getByText( 'Sales Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		// The value-tab count is shown, not the Other sources count.
		expect( getByText( '42' ) ).toBeInTheDocument();
		expect( queryByText( '7' ) ).not.toBeInTheDocument();
	} );

	it( 'omits the rate tile and uses the unattributed count on the Other sources tab', () => {
		const { getByText, queryByText } = render(
			<KeyActionTiles { ...props } isOtherSourcesTab />
		);

		// No rate tile (no per-source sessions to rate against).
		expect( queryByText( 'Sales Rate' ) ).not.toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		// The unattributed count is shown instead of the value-tab count.
		expect( getByText( '7' ) ).toBeInTheDocument();
		expect( queryByText( '42' ) ).not.toBeInTheDocument();
	} );
} );
