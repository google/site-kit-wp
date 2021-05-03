/**
 * WidgetAreaRenderer component tests.
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
import Data from 'googlesitekit-data';
import WidgetAreaRenderer from './WidgetAreaRenderer';
import { STORE_NAME, WIDGET_WIDTHS, WIDGET_AREA_STYLES } from '../datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	render,
	unsubscribeFromAll,
	waitFor,
} from '../../../../../tests/js/test-utils';

const { useSelect } = Data;

const createTestRegistryWithArea = ( areaName, style = WIDGET_AREA_STYLES.BOXES ) => {
	const registry = createTestRegistry();

	registry.dispatch( STORE_NAME ).registerWidgetArea( areaName, {
		title: 'Dashboard Header',
		subtitle: 'Cool stuff for yoursite.com',
		style,
	} );
	registry.dispatch( STORE_NAME ).assignWidgetArea( areaName, 'dashboard' );

	return registry;
};

const WidgetComponent = () => {
	const isConnected = useSelect( ( select ) => select( CORE_SITE ).isConnected() );

	return ( <div>Foo bar! Connected: { isConnected ? ' yes' : 'no' }.</div> );
};

const WidgetComponentEmpty = ( { WidgetNull } ) => {
	return <WidgetNull />;
};

const createWidgets = ( registry, areaName, widgets ) => {
	widgets.forEach( ( { Component, slug, width } ) => {
		registry.dispatch( STORE_NAME ).registerWidget( slug, {
			Component,
			width,
		} );
		registry.dispatch( STORE_NAME ).assignWidget( slug, areaName );
	} );
};

describe( 'WidgetAreaRenderer', () => {
	const areaName = 'gridcell-test';
	let registry;

	beforeEach( async () => {
		registry = createTestRegistryWithArea( areaName );
		const connection = { connected: true };
		await registry.dispatch( CORE_SITE ).receiveGetConnection( connection );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should return the same number of elements as widgets from a selector', async () => {
		createWidgets( registry, areaName, [
			{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.FULL },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( areaName );
		const { container } = render( <WidgetAreaRenderer slug={ areaName } />, { registry } );

		await waitFor( () => {
			expect( widgets ).toHaveLength( 3 );
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget' ) ).toHaveLength( 3 );
		} );
	} );

	it( 'should treat widgets that render no content as zero-width (ignoring them)', async () => {
		createWidgets( registry, areaName, [
			{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
			{ Component: WidgetComponentEmpty, slug: 'empty', width: WIDGET_WIDTHS.HALF },
			{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
		] );

		const { container } = render( <WidgetAreaRenderer slug={ areaName } />, { registry } );

		await waitFor( () => {
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();
		} );
	} );

	it.each(
		[
			[
				'12, 3-6 -> 12, 4-8',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.HALF },
				],
			],
			[
				'3, 12, 3-6, 6 -> 3, 12, 4-8, 6',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.HALF },
					{ Component: WidgetComponent, slug: 'five', width: WIDGET_WIDTHS.HALF },
				],
			],
			[
				'3-3-3, 6 -> 4-4-4, 6',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.HALF },
				],
			],
			[
				'3-3-3, 12 -> 4-4-4, 12',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.FULL },
				],
			],
			[
				'3-3-3, 12, 3-3-3 -> 4-4-4, 12, 4-4-4',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.FULL },
					{ Component: WidgetComponent, slug: 'five', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'six', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'seven', width: WIDGET_WIDTHS.QUARTER },
				],
			],
		]
	)( 'should resize widgets in a row that spans 9 columns to fill the full 12 columns (%s)', async ( testName, widgets ) => {
		createWidgets( registry, areaName, widgets );

		const { container } = render( <WidgetAreaRenderer slug={ areaName } />, { registry } );
		await waitFor( () => {
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();
		} );
	} );

	it.each(
		[
			[
				'3-3',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
				],
			],
			[
				'6',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.HALF },
				],
			],
			[
				'3, 12, 3-3',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.QUARTER },
				],
			],
		]
	)( 'should not resize widgets in a row that is smaller than 9 columns (%s)', async ( testName, widgets ) => {
		createWidgets( registry, areaName, widgets );

		const { container } = render( <WidgetAreaRenderer slug={ areaName } />, { registry } );
		await waitFor( () => {
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();
		} );
	} );

	it.each(
		[
			[
				'3-3-3-3',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'four', width: WIDGET_WIDTHS.QUARTER },
				],
			],
			[
				'6-6',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.HALF },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.HALF },
				],
			],
			[
				'3-6-3',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.HALF },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.QUARTER },
				],
			],
			[
				'3-3-6',
				[
					{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.QUARTER },
					{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.HALF },
				],
			],
		]
	)( 'should not resize widgets that fit into a 12-column grid (%s)', async ( testName, widgets ) => {
		createWidgets( registry, areaName, widgets );

		const { container } = render( <WidgetAreaRenderer slug={ areaName } />, { registry } );
		await waitFor( () => {
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets' )[ 0 ] ).toMatchSnapshot();
		} );
	} );

	it( 'should output boxes style without extra grid markup', async () => {
		createWidgets( registry, areaName, [
			{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.FULL },
		] );

		const { container } = render( <WidgetAreaRenderer slug={ areaName } style={ WIDGET_AREA_STYLES.BOXES } />, { registry } );
		await waitFor( () => {
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets > .mdc-layout-grid__inner > .mdc-layout-grid__cell.mdc-layout-grid__cell--span-12 > .mdc-layout-grid > .mdc-layout-grid__inner' ) ).toHaveLength( 0 );
		} );
	} );

	it( 'should output composite style with extra grid markup', async () => {
		registry = createTestRegistryWithArea( areaName, WIDGET_AREA_STYLES.COMPOSITE );
		registry.dispatch( CORE_SITE ).receiveGetConnection( { connected: true } );
		createWidgets( registry, areaName, [
			{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
			{ Component: WidgetComponent, slug: 'two', width: WIDGET_WIDTHS.FULL },
			{ Component: WidgetComponent, slug: 'three', width: WIDGET_WIDTHS.FULL },
		] );

		const { container } = render( <WidgetAreaRenderer slug={ areaName } />, { registry } );
		await waitFor( () => {
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-widgets > .mdc-layout-grid__inner > .mdc-layout-grid__cell.mdc-layout-grid__cell--span-12 > .mdc-layout-grid > .mdc-layout-grid__inner' ) ).toHaveLength( 1 );
		} );
	} );

	it( 'should render a hidden widget area when it has no active widget', async () => {
		createWidgets( registry, areaName, [
			{ Component: WidgetComponentEmpty, slug: 'empty', width: WIDGET_WIDTHS.HALF },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( areaName );
		const { container } = render( <WidgetAreaRenderer slug={ areaName } />, { registry } );

		await waitFor( () => {
			expect( widgets ).toHaveLength( 1 );
			expect( container.querySelectorAll( '.googlesitekit-widget-area' ) ).toHaveLength( 1 );
			expect( container.querySelector( '.googlesitekit-widget-area' ) ).toHaveClass( 'googlesitekit-hidden' );
		} );
	} );

	it( 'should not render the widget area title, subtitle and icon if there is only widget area', async () => {
		createWidgets( registry, areaName, [
			{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( areaName );
		const { container } = render( <WidgetAreaRenderer slug={ areaName } totalAreas={ 1 } />, { registry } );

		await waitFor( () => {
			expect( widgets ).toHaveLength( 1 );
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-header' ) ).toHaveLength( 0 );
		} );
	} );

	it( 'should render the widget area title, subtitle and icon if there is more than widget area', async () => {
		createWidgets( registry, areaName, [
			{ Component: WidgetComponent, slug: 'one', width: WIDGET_WIDTHS.FULL },
		] );

		const widgets = registry.select( STORE_NAME ).getWidgets( areaName );
		const { container } = render( <WidgetAreaRenderer slug={ areaName } totalAreas={ 3 } />, { registry } );

		await waitFor( () => {
			expect( widgets ).toHaveLength( 1 );
			expect( container.firstChild.querySelectorAll( '.googlesitekit-widget-area-header' ) ).toHaveLength( 1 );
		} );
	} );
} );
