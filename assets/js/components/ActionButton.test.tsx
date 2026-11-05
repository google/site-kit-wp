/**
 * ActionButton tests.
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
import PlusCircle from '@/svg/icons/plus-circle.svg';
import { fireEvent, render, screen } from '@tests/js/test-utils';
import ActionButton from './ActionButton';

jest.mock( '@/svg/icons/plus-circle.svg', () => jest.fn( () => null ) );

describe( 'ActionButton', () => {
	it( 'renders a native icon button with its label, size and additional classes', () => {
		render(
			<ActionButton
				Icon={ PlusCircle }
				label="Add question"
				iconSize={ 18 }
				className="extra-class"
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Add question' } );

		expect( button.tagName ).toBe( 'BUTTON' );
		expect( button ).toHaveAttribute( 'type', 'button' );

		expect( button ).toHaveClass(
			'googlesitekit-action-button__button',
			'extra-class'
		);

		expect( PlusCircle ).toHaveBeenCalledWith(
			expect.objectContaining( {
				width: 18,
				height: 18,
				'aria-hidden': 'true',
				focusable: 'false',
			} ),
			expect.anything()
		);
	} );

	it( 'forwards the button ref, HTML attributes and event handlers', () => {
		const ref = jest.fn();
		const onClick = jest.fn();
		const onKeyDown = jest.fn();

		const { unmount } = render(
			<ActionButton
				Icon={ PlusCircle }
				label="Add"
				ref={ ref }
				type="submit"
				name="action"
				value="add"
				aria-describedby="instructions"
				onClick={ onClick }
				onKeyDown={ onKeyDown }
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Add' } );

		expect( ref ).toHaveBeenLastCalledWith( button );

		expect( button ).toHaveAttribute( 'type', 'submit' );
		expect( button ).toHaveAttribute( 'name', 'action' );
		expect( button ).toHaveAttribute( 'value', 'add' );
		expect( button ).toHaveAttribute( 'aria-describedby', 'instructions' );

		fireEvent.click( button );
		fireEvent.keyDown( button, { key: 'ArrowDown' } );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
		expect( onKeyDown ).toHaveBeenCalledTimes( 1 );

		unmount();

		expect( ref ).toHaveBeenLastCalledWith( null );
	} );

	it( 'shows a tooltip when one is provided', async () => {
		const onClick = jest.fn();

		render(
			<ActionButton
				Icon={ PlusCircle }
				label="Add question"
				tooltip="Add this question to your survey"
				onClick={ onClick }
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Add question' } );

		fireEvent.mouseOver( button );

		expect( await screen.findByRole( 'tooltip' ) ).toHaveTextContent(
			'Add this question to your survey'
		);

		fireEvent.click( button );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows a tooltip even if disabled', async () => {
		const onClick = jest.fn();

		render(
			<ActionButton
				Icon={ PlusCircle }
				label="Add question"
				tooltip="Maximum questions reached"
				onClick={ onClick }
				disabled
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Add question' } );

		expect( button ).toBeDisabled();

		fireEvent.mouseOver( button );

		expect( await screen.findByRole( 'tooltip' ) ).toHaveTextContent(
			'Maximum questions reached'
		);

		fireEvent.click( button );

		expect( onClick ).not.toHaveBeenCalled();
	} );
} );
