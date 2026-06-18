/**
 * Site Goals TilesGroup tests.
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
import { TilesGroup } from './TilesGroup';

describe( 'TilesGroup', () => {
	it( 'renders the badge below the section title when the badge prop is provided', () => {
		const { container, getByText } = render(
			<TilesGroup title="Key action" badge={ <span>Partial data</span> }>
				<div>tile</div>
			</TilesGroup>
		);

		const badge = container.querySelector(
			'.googlesitekit-site-goals-tiles-group__badge'
		);
		expect( badge ).toBeInTheDocument();
		expect( badge ).toHaveTextContent( 'Partial data' );
		expect( getByText( 'Key action' ) ).toBeInTheDocument();
	} );

	it( 'does not render a badge container when no badge prop is provided', () => {
		const { container } = render(
			<TilesGroup title="Key action">
				<div>tile</div>
			</TilesGroup>
		);

		expect(
			container.querySelector(
				'.googlesitekit-site-goals-tiles-group__badge'
			)
		).not.toBeInTheDocument();
	} );
} );
