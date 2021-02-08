/**
 * Widgets separation utilities tests.
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
import { separateNullWidgets } from './separate-null-widgets';

describe( 'separateNullWidgets', () => {
	const fooWidget = {
		slug: 'foo',
		Component: () => true,
	};

	const barWidget = {
		slug: 'bar',
		Component: () => true,
	};

	const bazWidget = {
		slug: 'baz',
		Component: () => true,
	};

	it( 'correctly handles no widgets', () => {
		const widgets = [];
		const widgetStates = {};

		const expectedWidgetStates = {
			activeWidgets: [],
			inactiveWidgets: [],
		};

		expect( separateNullWidgets( widgets, widgetStates ) ).toStrictEqual( expectedWidgetStates );
	} );

	it( 'correctly handles inactive widgets', () => {
		const widgets = [ fooWidget, barWidget, bazWidget ];
		const widgetStates = { foo: null, bar: undefined };

		const expectedWidgetStates = {
			activeWidgets: [],
			inactiveWidgets: [ fooWidget, barWidget, bazWidget ],
		};

		expect( separateNullWidgets( widgets, widgetStates ) ).toStrictEqual( expectedWidgetStates );
	} );

	it( 'correctly handles active widgets', () => {
		const widgets = [ fooWidget, barWidget, bazWidget ];
		const widgetStates = {
			foo: true,
			bar: true,
			baz: null,
		};

		const expectedWidgetStates = {
			activeWidgets: [ fooWidget, barWidget ],
			inactiveWidgets: [ bazWidget ],
		};

		expect( separateNullWidgets( widgets, widgetStates ) ).toStrictEqual( expectedWidgetStates );
	} );
} );
