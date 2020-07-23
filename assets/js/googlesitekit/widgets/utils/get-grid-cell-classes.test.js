/**
 * Widgets: Grid Cell Layout utility tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
	unsubscribeFromAll,
	// muteConsole,
} from '../../../../../tests/js/utils';
// import { render } from '../../../../../tests/js/test-utils';
import { STORE_NAME, WIDGET_WIDTHS } from '../datastore/constants';
// import { WidgetComponents } from './widgets';
// import { WIDTH_GRID_MAP, WIDGET_WIDTHS } from '../datastore/constants';
import { getGridCellClasses } from './get-grid-cell-classes';

const WidgetComponent = () => {
	return ( <div>Foo bar!</div> );
};

const createWidgets = ( registry, widgets ) => {
	widgets.forEach( ( { component, slug, width } ) => {
		registry.dispatch( STORE_NAME ).registerWidget( slug, {
			component,
			width,
		} );
		registry.dispatch( STORE_NAME ).assignWidget( slug, 'gridcell-test' );
	} );
};

describe( 'getGridCellClasses', () => {
	let registry;
	// let store;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( STORE_NAME ).registerWidgetArea( 'gridcell-test', {
			title: 'Dashboard Header',
			subtitle: 'Cool stuff for yoursite.com',
			style: 'boxes',
		} );
		registry.dispatch( STORE_NAME ).assignWidgetArea( 'gridcell-test', 'dashboard' );
		// store = registry.stores[ STORE_NAME ].store;
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should return the same number of elements as widgets from a selector', () => {
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.FULL },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( widgets ).toHaveLength( 3 );
		expect( getGridCellClasses( widgets ) ).toHaveLength( 3 );
	} );

	it( 'should return all full classNames when all widgets are full-width', () => {
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.FULL },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();
	} );

	it( 'should return appropriate classNames for each width', () => {
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.HALF },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();
	} );
} );
