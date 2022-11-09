/**
 * WidgetNull component tests.
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
import WidgetNull from './WidgetNull';
import {
	createTestRegistry,
	provideModules,
	provideUserCapabilities,
	render,
} from '../../../../../tests/js/test-utils';
import { CORE_WIDGETS } from '../datastore/constants';
import Null from '../../../components/Null';

describe( 'WidgetNull', () => {
	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
		provideModules( registry );
		provideUserCapabilities( registry );
	} );

	it( 'should return an empty element', () => {
		const widgetSlug = 'TestWidget';

		// Initial state should be null.
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toBe( null );

		const widget = render( <WidgetNull widgetSlug={ widgetSlug } />, {
			registry,
		} );

		expect( widget.container ).toBeEmptyDOMElement();

		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toMatchObject( {
			Component: Null,
			metadata: {},
		} );

		// Special state should be unset again upon unmount.
		widget.unmount();
		expect(
			registry.select( CORE_WIDGETS ).getWidgetState( widgetSlug )
		).toBe( null );
	} );
} );
