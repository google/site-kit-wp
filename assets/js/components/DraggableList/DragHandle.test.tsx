/**
 * DragHandle component tests.
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
import DragHandleIcon from '@/svg/icons/drag-handle.svg';
import { fireEvent, render, screen } from '@tests/js/test-utils';
import DragHandle from './DragHandle';
import { DragHandleContext } from './DragHandleContext';

jest.mock( '@/svg/icons/drag-handle.svg', () => jest.fn( () => null ) );

describe( 'DragHandle', () => {
	it( 'should receive its ref, instructions, and keyboard handler from its item context', () => {
		const ref = jest.fn();
		const onKeyDown = jest.fn();

		const { unmount } = render(
			<DragHandleContext.Provider
				value={ {
					ref,
					type: 'button',
					'aria-describedby': 'instructions',
					onKeyDown,
				} }
			>
				<DragHandle label="Move Answer 2" />
			</DragHandleContext.Provider>
		);

		const button = screen.getByRole( 'button', { name: 'Move Answer 2' } );

		expect( ref ).toHaveBeenLastCalledWith( button );
		expect( button ).toHaveAttribute( 'aria-describedby', 'instructions' );
		expect( button ).toHaveAttribute( 'type', 'button' );

		fireEvent.keyDown( button, { key: 'ArrowDown' } );

		expect( onKeyDown ).toHaveBeenCalledTimes( 1 );

		expect( DragHandleIcon ).toHaveBeenCalledWith(
			expect.objectContaining( {
				'aria-hidden': 'true',
				focusable: 'false',
			} ),
			expect.anything()
		);

		unmount();

		expect( ref ).toHaveBeenLastCalledWith( null );
	} );
} );
