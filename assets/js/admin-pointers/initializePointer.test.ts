/**
 * `initializePointer` tests.
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
import initializePointer from './initializePointer';
import type { AdminPointer } from './types';

const AJAX_URL = 'https://example.com/wp-admin/admin-ajax.php';

const POINTER: AdminPointer = {
	slug: 'test-pointer',
	class: 'wp-pointer test-pointer',
	targetID: 'test-target',
	title: 'Test pointer title',
	content: '<p>Test pointer content.</p>',
	position: 'top',
	tracking: null,
};

describe( 'initializePointer', () => {
	it( 'posts the dismiss-wp-pointer action with the slug when the pointer closes', () => {
		const target = { length: 1, pointer: jest.fn() };
		target.pointer.mockReturnValue( target );
		const $ = Object.assign(
			jest.fn( () => target ),
			{ post: jest.fn() }
		);

		initializePointer( $, AJAX_URL, POINTER );

		const [ options ] = target.pointer.mock.calls[ 0 ];
		options.close();

		expect( $.post ).toHaveBeenCalledWith( AJAX_URL, {
			action: 'dismiss-wp-pointer',
			pointer: 'test-pointer',
		} );
	} );
} );
