/**
 * Tests for utilities for extracting text from React children.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getLabelFromChildren } from './react-children-to-text';

describe( 'getLabelFromChildren', () => {
	it.each( [
		[ 'Simple Text', 'Simple Text' ],
		[ '123', 123 ],
		// eslint-disable-next-line react/jsx-key
		[ 'Fragment Wrapper', <Fragment>Fragment Wrapper</Fragment> ],
		// eslint-disable-next-line react/jsx-key
		[ 'Regular Element Wrapper', <span>Regular Element Wrapper </span> ],
		[
			'Complex Element With 5 Sub Children',
			// eslint-disable-next-line react/jsx-key
			<div>
				Complex Element
				<span>
					<a href="https://example.com"> With</a>
					<span>{ 5 }</span>
				</span>
				<span>
					Sub<span>&nbsp;Children </span>
				</span>
			</div>,
		],
	] )( 'should return the label %s', ( expectedLabel, children ) => {
		expect( getLabelFromChildren( children ) ).toBe( expectedLabel );
	} );
} );
