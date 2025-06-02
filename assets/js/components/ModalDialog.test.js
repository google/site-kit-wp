/**
 * ModalDialog component tests.
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
	provideModules,
	render,
	fireEvent,
} from '../../../tests/js/test-utils';
import ModalDialog from './ModalDialog';
import { Button } from 'googlesitekit-components';
import { Fragment } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

describe( 'ConfirmDisableConsentModeDialog', () => {
	let registry;
	const onClose = jest.fn();
	const onHandleConfirm = jest.fn();

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
	} );

	it( 'should trigger onCancel callback and refocus on the correct element on close.', () => {
		let dialogActive = true;

		const handleDialog = jest.fn( () => {
			dialogActive = ! dialogActive;
		} );

		const { container } = render(
			<Fragment>
				<Button className="refocus-test-button">
					Refocus Test Button
				</Button>

				<ModalDialog
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

		fireEvent.keyDown( container, { key: ESCAPE, keyCode: 27 } );

		const refocusTestButton = container.querySelector(
			'button.refocus-test-button'
		);

		expect( refocusTestButton ).toHaveFocus();
	} );
} );
