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

const createTestRegistryWithArea = ( name = 'gridcell-test' ) => {
	const registry = createTestRegistry();

	registry.dispatch( STORE_NAME ).registerWidgetArea( name, {
		title: 'Dashboard Header',
		subtitle: 'Cool stuff for yoursite.com',
		style: 'boxes',
	} );
	registry.dispatch( STORE_NAME ).assignWidgetArea( name, 'dashboard' );

	return registry;
};

const WidgetComponent = () => {
	return ( <div>Foo bar!</div> );
};

const WidgetComponentEmpty = () => {
	return null;
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
		registry = createTestRegistryWithArea();
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

	it( 'should resize desktop-sized widgets so they fill a row', () => {
		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.HALF },
		] );

		let widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.QUARTER },
		] );

		widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.HALF },
			{ component: WidgetComponent, slug: 'five', width: WIDGET_WIDTHS.HALF },
		] );

		widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.HALF },
		] );

		widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.HALF },
		] );

		widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.FULL },
		] );

		widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'five', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'six', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'seven', width: WIDGET_WIDTHS.QUARTER },
		] );

		widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();
	} );

	it( 'should not resize widgets that fit into a 12-column grid', () => {
		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.QUARTER },
		] );

		let widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.HALF },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.HALF },
		] );

		widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.HALF },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
		] );

		widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();
	} );

	it.skip( 'should treat widgets that render no content as zero-width (ignoring them)', () => {
		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponentEmpty, slug: 'two', width: WIDGET_WIDTHS.HALF },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );

		expect( getGridCellClasses( widgets ) ).toMatchSnapshot();
	} );
} );
