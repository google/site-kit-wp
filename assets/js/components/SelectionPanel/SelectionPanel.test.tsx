/**
 * SelectionPanel component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	act,
	createTestRegistry,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import SelectionPanel from './SelectionPanel';

describe( 'SelectionPanel', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'sets selectionPanelOpen to true in CORE_UI when isOpen is true', async () => {
		render(
			<SelectionPanel isOpen={ true } closePanel={ () => {} }>
				<div>Panel Content</div>
			</SelectionPanel>,
			{ registry }
		);

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( 'selectionPanelOpen' )
			).toBe( true );
		} );
	} );

	it( 'sets selectionPanelOpen to false in CORE_UI when isOpen is false', async () => {
		// First open the panel.
		await registry
			.dispatch( CORE_UI )
			.setValue( 'selectionPanelOpen', true );

		render(
			<SelectionPanel isOpen={ false } closePanel={ () => {} }>
				<div>Panel Content</div>
			</SelectionPanel>,
			{ registry }
		);

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( 'selectionPanelOpen' )
			).toBe( false );
		} );
	} );

	it( 'resets selectionPanelOpen to false in CORE_UI on unmount', async () => {
		const { unmount } = render(
			<SelectionPanel isOpen={ true } closePanel={ () => {} }>
				<div>Panel Content</div>
			</SelectionPanel>,
			{ registry }
		);

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( 'selectionPanelOpen' )
			).toBe( true );
		} );

		act( () => {
			unmount();
		} );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( 'selectionPanelOpen' )
			).toBe( false );
		} );
	} );
} );
