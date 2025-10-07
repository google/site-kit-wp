/**
 * RefocusableModalDialog component tests.
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
	createTestRegistry,
	render,
	fireEvent,
} from '../../../tests/js/test-utils';
import RefocusableModalDialog from './RefocusableModalDialog';
import { Button } from 'googlesitekit-components';
import { Fragment } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';
import { waitFor } from '@testing-library/react';

describe( 'RefocusableModalDialog', () => {
	let registry;
	const onClose = vi.fn();
	const onHandleConfirm = vi.fn();

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should refocus the element assigned to refocusQuerySelector on close.', async () => {
		let dialogActive = true;

		const handleDialog = vi.fn( () => {
			dialogActive = ! dialogActive;
		} );

		const { container, rerender } = render(
			<RefocusableModalDialog
				title="Test Dialog"
				dialogActive={ false }
				handleDialog={ handleDialog }
				handleConfirm={ onHandleConfirm }
				onClose={ onClose }
				refocusQuerySelector="button.refocus-test-button"
			/>,
			{
				registry,
			}
		);

		// Rerender with modal being active, to allow fo the modal buttons to populate the DOM,
		// otherwise test env will throw error for focus trap not having elements to focus.
		rerender(
			<Fragment>
				<Button className="refocus-test-button">
					Refocus Test Button
				</Button>

				<RefocusableModalDialog
					title="Test Dialog"
					dialogActive={ dialogActive }
					handleDialog={ handleDialog }
					handleConfirm={ onHandleConfirm }
					onClose={ onClose }
					refocusQuerySelector="button.refocus-test-button"
				/>
			</Fragment>,
			{
				registry,
			}
		);

		const buttonToSetFocusOn = container.querySelector(
			'button.refocus-test-button'
		);

		fireEvent.keyDown( container, { key: ESCAPE, keyCode: 27 } );

		await waitFor( () => {
			expect( buttonToSetFocusOn ).toHaveFocus();
		} );
	} );
} );
