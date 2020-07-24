/**
 * WidgetAreaRenderer component tests.
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
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WidgetAreaRenderer from './WidgetAreaRenderer';
import { STORE_NAME, WIDGET_WIDTHS } from '../datastore/constants';
import {
	createTestRegistry,
	muteConsole,
	render,
	unsubscribeFromAll,
} from '../../../../../tests/js/test-utils';

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

const WidgetComponent = forwardRef( ( _props, ref ) => {
	return ( <div ref={ ref }>Foo bar!</div> );
} );

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

describe( 'WidgetAreaRenderer', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistryWithArea();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should return the same number of elements as widgets from a selector', async () => {
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.FULL },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( 'gridcell-test' );
		const { container } = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } );

		expect( widgets ).toHaveLength( 3 );
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget' ) ).toHaveLength( 3 );
	} );

	it( 'should resize widgets so they fill a row', () => {
		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.HALF },
		] );

		let container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.QUARTER },
		] );
		container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.HALF },
			{ component: WidgetComponent, slug: 'five', width: WIDGET_WIDTHS.HALF },
		] );
		container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.HALF },
		] );
		container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.HALF },
		] );
		container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.FULL },
		] );
		container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();

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
		container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();
	} );

	it( 'should treat widgets that render no content as zero-width (ignoring them)', () => {
		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponentEmpty, slug: 'empty', width: WIDGET_WIDTHS.HALF },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
		] );

		// Used to mute the forwardRef error React will throw here.
		muteConsole( 'error', 1 );
		const { container } = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } );

		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();
	} );

	it( 'should not resize widgets that fit into a 12-column grid', () => {
		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.QUARTER },
		] );

		let container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.HALF },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.HALF },
		] );
		container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();

		registry = createTestRegistryWithArea( 'gridcell-test' );
		createWidgets( registry, [
			{ component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.HALF },
			{ component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
		] );
		container = render( <WidgetAreaRenderer slug="gridcell-test" />, { registry } ).container;
		expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();
	} );
} );
