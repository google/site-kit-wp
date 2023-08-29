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
 * External dependencies
 */
import { getByText } from '@testing-library/dom';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import WidgetAreaRenderer from './WidgetAreaRenderer';
import {
	CORE_WIDGETS,
	WIDGET_WIDTHS,
	WIDGET_AREA_STYLES,
} from '../datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	render,
	provideModules,
	provideUserCapabilities,
	unsubscribeFromAll,
} from '../../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../constants';
import {
	PERMISSION_READ_SHARED_MODULE_DATA,
	PERMISSION_VIEW_DASHBOARD,
} from '../../datastore/user/constants';

const { useSelect } = Data;

const createTestRegistryWithArea = (
	areaName,
	style = WIDGET_AREA_STYLES.BOXES
) => {
	const registry = createTestRegistry();

	registry.dispatch( CORE_WIDGETS ).registerWidgetArea( areaName, {
		title: 'Dashboard Header',
		subtitle: 'Cool stuff for yoursite.com',
		style,
	} );
	registry.dispatch( CORE_WIDGETS ).assignWidgetArea( areaName, 'dashboard' );

	return registry;
};

const WidgetComponent = () => {
	const isConnected = useSelect( ( select ) =>
		select( CORE_SITE ).isConnected()
	);

	return <div>Foo bar! Connected: { isConnected ? ' yes' : 'no' }.</div>;
};

const WidgetComponentEmpty = ( { WidgetNull } ) => {
	return <WidgetNull />;
};

const createWidgets = ( registry, areaName, widgets ) => {
	widgets.forEach( ( { Component, modules, slug, width } ) => {
		registry.dispatch( CORE_WIDGETS ).registerWidget( slug, {
			Component,
			modules,
			width,
		} );
		registry.dispatch( CORE_WIDGETS ).assignWidget( slug, areaName );
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

	it( 'should return the same number of elements as widgets from a selector', () => {
		createWidgets( registry, areaName, [
			{
				Component: WidgetComponent,
				slug: 'one',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: WidgetComponent,
				slug: 'two',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: WidgetComponent,
				slug: 'three',
				width: WIDGET_WIDTHS.FULL,
			},
		] );

		const widgets = registry.select( CORE_WIDGETS ).getWidgets( areaName );
		const { container } = render(
			<WidgetAreaRenderer slug={ areaName } />,
			{ registry }
		);

		expect( widgets ).toHaveLength( 3 );
		expect(
			container.firstChild.querySelectorAll( '.googlesitekit-widget' )
		).toHaveLength( 3 );
	} );

	it( 'should only render widgets the user has access to in a view-only viewContext', () => {
		createWidgets( registry, areaName, [
			{
				Component: WidgetComponent,
				modules: 'search-console',
				slug: 'one',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: WidgetComponent,
				modules: 'search-console',
				slug: 'two',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: () => <div>AdSense is here</div>,
				modules: 'adsense',
				slug: 'three',
				width: WIDGET_WIDTHS.FULL,
			},
		] );

		// Make sure our test module is loaded so we can test for it appearing
		// when the view-only dashboard is rendererd.
		provideModules( registry, [ { slug: 'AdSense', name: 'AdSense' } ] );

		// Allow the current user to view the Search Console module's data,
		// but not AdSense's data.
		provideUserCapabilities( registry, {
			[ PERMISSION_VIEW_DASHBOARD ]: true,
			[ `${ PERMISSION_READ_SHARED_MODULE_DATA }::["adsense"]` ]: false,
			[ `${ PERMISSION_READ_SHARED_MODULE_DATA }::["search-console"]` ]: true,
		} );

		const widgets = registry.select( CORE_WIDGETS ).getWidgets( areaName );
		const { container } = render(
			<WidgetAreaRenderer slug={ areaName } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		// There should be three widgets registered in the datastore.
		expect( widgets ).toHaveLength( 3 );

		// Only two widgets should appear in the DOM, because we don't have
		// access to the third, AdSense widget.
		expect(
			container.firstChild.querySelectorAll( '.googlesitekit-widget' )
		).toHaveLength( 2 );

		// Ensure the AdSense widget is not rendered.
		expect( container.firstChild ).not.toHaveTextContent(
			'AdSense is here'
		);
	} );

	it( 'should render all widgets when not in a view-only viewContext', () => {
		createWidgets( registry, areaName, [
			{
				Component: WidgetComponent,
				modules: 'search-console',
				slug: 'one',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: WidgetComponent,
				modules: 'search-console',
				slug: 'two',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: () => <div>AdSense is here</div>,
				modules: 'adsense',
				slug: 'three',
				width: WIDGET_WIDTHS.FULL,
			},
		] );

		// Add our dashboard sharing capabilities into state.
		const widgets = registry.select( CORE_WIDGETS ).getWidgets( areaName );
		const { container } = render(
			<WidgetAreaRenderer slug={ areaName } />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		// There should be three widgets registered in the datastore.
		expect( widgets ).toHaveLength( 3 );

		// All widgets should appear in the DOM because we aren't in a view-only
		// viewContext.
		expect(
			container.firstChild.querySelectorAll( '.googlesitekit-widget' )
		).toHaveLength( 3 );

		// Ensure the AdSense widget is rendered.
		expect( container.firstChild ).toHaveTextContent( 'AdSense is here' );
	} );

	it( 'should treat widgets that render no content as zero-width (ignoring them)', () => {
		createWidgets( registry, areaName, [
			{
				Component: WidgetComponent,
				slug: 'one',
				width: WIDGET_WIDTHS.QUARTER,
			},
			{
				Component: WidgetComponentEmpty,
				slug: 'empty',
				width: WIDGET_WIDTHS.HALF,
			},
			{
				Component: WidgetComponent,
				slug: 'three',
				width: WIDGET_WIDTHS.QUARTER,
			},
		] );

		const { container } = render(
			<WidgetAreaRenderer slug={ areaName } />,
			{ registry }
		);

		expect(
			container.firstChild.querySelectorAll(
				'.googlesitekit-widget-area-widgets'
			)[ 0 ]
		).toMatchSnapshot();
	} );

	it.each( [
		[
			'12, 3-6 -> 12, 4-8',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.FULL,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.HALF,
				},
			],
		],
		[
			'3, 12, 3-6, 6 -> 3, 12, 4-8, 6',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.FULL,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'four',
					width: WIDGET_WIDTHS.HALF,
				},
				{
					Component: WidgetComponent,
					slug: 'five',
					width: WIDGET_WIDTHS.HALF,
				},
			],
		],
		[
			'3-3-3, 6 -> 4-4-4, 6',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'four',
					width: WIDGET_WIDTHS.HALF,
				},
			],
		],
		[
			'3-3-3, 12 -> 4-4-4, 12',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'four',
					width: WIDGET_WIDTHS.FULL,
				},
			],
		],
		[
			'3-3-3, 12, 3-3-3 -> 4-4-4, 12, 4-4-4',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'four',
					width: WIDGET_WIDTHS.FULL,
				},
				{
					Component: WidgetComponent,
					slug: 'five',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'six',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'seven',
					width: WIDGET_WIDTHS.QUARTER,
				},
			],
		],
	] )(
		'should resize widgets in a row that spans 9 columns to fill the full 12 columns (%s)',
		( testName, widgets ) => {
			createWidgets( registry, areaName, widgets );

			const { container } = render(
				<WidgetAreaRenderer slug={ areaName } />,
				{ registry }
			);

			expect(
				container.firstChild.querySelectorAll(
					'.googlesitekit-widget-area-widgets'
				)[ 0 ]
			).toMatchSnapshot();
		}
	);

	it.each( [
		[
			'3-3',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.QUARTER,
				},
			],
		],
		[
			'6',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.HALF,
				},
			],
		],
		[
			'3, 12, 3-3',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.FULL,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'four',
					width: WIDGET_WIDTHS.QUARTER,
				},
			],
		],
	] )(
		'should not resize widgets in a row that is smaller than 9 columns (%s)',
		( testName, widgets ) => {
			createWidgets( registry, areaName, widgets );

			const { container } = render(
				<WidgetAreaRenderer slug={ areaName } />,
				{ registry }
			);

			expect(
				container.firstChild.querySelectorAll(
					'.googlesitekit-widget-area-widgets'
				)[ 0 ]
			).toMatchSnapshot();
		}
	);

	it.each( [
		[
			'3-3-3-3',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'four',
					width: WIDGET_WIDTHS.QUARTER,
				},
			],
		],
		[
			'6-6',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.HALF,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.HALF,
				},
			],
		],
		[
			'3-6-3',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.HALF,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.QUARTER,
				},
			],
		],
		[
			'3-3-6',
			[
				{
					Component: WidgetComponent,
					slug: 'one',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'two',
					width: WIDGET_WIDTHS.QUARTER,
				},
				{
					Component: WidgetComponent,
					slug: 'three',
					width: WIDGET_WIDTHS.HALF,
				},
			],
		],
	] )(
		'should not resize widgets that fit into a 12-column grid (%s)',
		( testName, widgets ) => {
			createWidgets( registry, areaName, widgets );

			const { container } = render(
				<WidgetAreaRenderer slug={ areaName } />,
				{ registry }
			);

			expect(
				container.firstChild.querySelectorAll(
					'.googlesitekit-widget-area-widgets'
				)[ 0 ]
			).toMatchSnapshot();
		}
	);

	it( 'should output boxes style without extra grid markup', () => {
		createWidgets( registry, areaName, [
			{
				Component: WidgetComponent,
				slug: 'one',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: WidgetComponent,
				slug: 'two',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: WidgetComponent,
				slug: 'three',
				width: WIDGET_WIDTHS.FULL,
			},
		] );

		const { container } = render(
			<WidgetAreaRenderer
				slug={ areaName }
				style={ WIDGET_AREA_STYLES.BOXES }
			/>,
			{ registry }
		);

		expect(
			container.firstChild.querySelectorAll(
				'.googlesitekit-widget-area-widgets > .mdc-layout-grid__inner > .mdc-layout-grid__cell.mdc-layout-grid__cell--span-12 > .mdc-layout-grid > .mdc-layout-grid__inner'
			)
		).toHaveLength( 0 );
	} );

	it( 'should output composite style with extra grid markup', () => {
		registry = createTestRegistryWithArea(
			areaName,
			WIDGET_AREA_STYLES.COMPOSITE
		);
		registry
			.dispatch( CORE_SITE )
			.receiveGetConnection( { connected: true } );
		createWidgets( registry, areaName, [
			{
				Component: WidgetComponent,
				slug: 'one',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: WidgetComponent,
				slug: 'two',
				width: WIDGET_WIDTHS.FULL,
			},
			{
				Component: WidgetComponent,
				slug: 'three',
				width: WIDGET_WIDTHS.FULL,
			},
		] );

		const { container } = render(
			<WidgetAreaRenderer slug={ areaName } />,
			{ registry }
		);

		expect(
			container.firstChild.querySelectorAll(
				'.googlesitekit-widget-area-widgets > .mdc-layout-grid__inner > .mdc-layout-grid__cell.mdc-layout-grid__cell--span-12 > .mdc-layout-grid > .mdc-layout-grid__inner'
			)
		).toHaveLength( 1 );
	} );

	it( 'should render a hidden widget area when it has no active widget', () => {
		createWidgets( registry, areaName, [
			{
				Component: WidgetComponentEmpty,
				slug: 'empty',
				width: WIDGET_WIDTHS.HALF,
			},
		] );

		const widgets = registry.select( CORE_WIDGETS ).getWidgets( areaName );
		const { container } = render(
			<WidgetAreaRenderer slug={ areaName } />,
			{ registry }
		);

		expect( widgets ).toHaveLength( 1 );
		expect(
			container.querySelectorAll( '.googlesitekit-widget-area' )
		).toMatchSnapshot();
		expect(
			container.querySelector( '.googlesitekit-widget-area' )
		).toHaveClass( 'googlesitekit-hidden' );
	} );

	it( 'should render the widget area title, subtitle and icon', () => {
		createWidgets( registry, areaName, [
			{
				Component: WidgetComponent,
				slug: 'one',
				width: WIDGET_WIDTHS.FULL,
			},
		] );

		const widgets = registry.select( CORE_WIDGETS ).getWidgets( areaName );
		const { container } = render(
			<WidgetAreaRenderer slug={ areaName } />,
			{ registry }
		);

		expect( widgets ).toHaveLength( 1 );
		expect(
			container.firstChild.querySelectorAll(
				'.googlesitekit-widget-area-header'
			)
		).toHaveLength( 1 );
	} );

	it( 'should combine multiple widgets in RecoverableModules state with the same metadata into a single widget', async () => {
		provideModules( registry, [
			{
				slug: 'search-console',
				recoverable: true,
			},
		] );

		provideUserCapabilities( registry, {
			[ PERMISSION_VIEW_DASHBOARD ]: true,
			[ `${ PERMISSION_READ_SHARED_MODULE_DATA }::["search-console"]` ]: true,
		} );

		createWidgets( registry, areaName, [
			{
				Component: WidgetComponent,
				slug: 'one',
				modules: [ 'search-console' ],
			},
			{
				Component: WidgetComponent,
				slug: 'two',
				modules: [ 'search-console' ],
			},
		] );

		const { container, waitForRegistry } = render(
			<WidgetAreaRenderer slug={ areaName } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			}
		);

		await waitForRegistry();

		const visibleWidgetSelector =
			'.googlesitekit-widget-area-widgets > .mdc-layout-grid__inner > .mdc-layout-grid__cell > .googlesitekit-widget';

		// There should be a single visible widget.
		expect(
			container.firstChild.querySelectorAll( visibleWidgetSelector )
		).toHaveLength( 1 );

		// The visible widget should be rendered as the RecoverableModules component.
		expect(
			getByText(
				container.firstChild.querySelector( visibleWidgetSelector ),
				'Search Console data was previously shared by an admin who no longer has access. Please contact another admin to restore it.'
			)
		).toBeInTheDocument();

		// There should also be a hidden widget.
		expect(
			container.firstChild.querySelectorAll(
				'.googlesitekit-widget-area-widgets .googlesitekit-hidden .googlesitekit-widget'
			)
		).toHaveLength( 1 );

		expect(
			container.firstChild.querySelector(
				'.googlesitekit-widget-area-widgets'
			)
		).toMatchSnapshot();
	} );
} );
