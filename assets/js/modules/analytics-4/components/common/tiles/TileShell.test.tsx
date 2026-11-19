/**
 * TileShell component tests.
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
import TileShell from './TileShell';

describe( 'TileShell', () => {
	it( 'should render the title in the "body small" style', () => {
		const { getByRole } = render(
			<TileShell
				baseClassName="googlesitekit-table-tile"
				title="Visitor breakdown"
			/>
		);

		expect(
			getByRole( 'heading', {
				level: 3,
				name: 'Visitor breakdown',
			} )
		).toHaveClass(
			'googlesitekit-typography--body',
			'googlesitekit-typography--small'
		);
	} );

	it( 'should keep the "body small" style on an h4 title', () => {
		const { getByRole } = render(
			<TileShell
				baseClassName="googlesitekit-table-tile"
				title="Visitor breakdown"
				titleAs="h4"
			/>
		);

		expect(
			getByRole( 'heading', {
				level: 4,
				name: 'Visitor breakdown',
			} )
		).toHaveClass(
			'googlesitekit-typography--body',
			'googlesitekit-typography--small'
		);
	} );
} );
