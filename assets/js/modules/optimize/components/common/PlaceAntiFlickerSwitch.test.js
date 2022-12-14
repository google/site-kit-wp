/**
 * PlaceAntiFlickerSwitch component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import PlaceAntiFlickerSwitch from './PlaceAntiFlickerSwitch';
import {
	createTestRegistry,
	render,
	unsubscribeFromAll,
} from '../../../../../../tests/js/test-utils';
import { MODULES_OPTIMIZE } from '../../datastore/constants';

describe( 'PlaceAntiFlickerSwitch', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it.each( [
		[ false, 'Site Kit will not add the code to your site. Learn more' ],
		[ true, 'Site Kit will add the code automatically. Learn more' ],
	] )(
		'should render the correct message when placeAntiFlickerSwitch is %s',
		( args, expected ) => {
			registry
				.dispatch( MODULES_OPTIMIZE )
				.receiveGetSettings( { placeAntiFlickerSnippet: args } );
			const { container } = render( <PlaceAntiFlickerSwitch />, {
				registry,
			} );

			const selectedText = container.querySelector( 'p' );
			expect( selectedText ).toHaveTextContent( expected );
		}
	);
} );
