/**
 * Widget Stories.
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
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
	provideUserCapabilities,
} from '../tests/js/utils';
import Widget from '../assets/js/googlesitekit/widgets/components/Widget';
import WidgetAreaRenderer from '../assets/js/googlesitekit/widgets/components/WidgetAreaRenderer';
import { STORE_NAME, WIDGET_WIDTHS, WIDGET_AREA_STYLES } from '../assets/js/googlesitekit/widgets/datastore/constants';
const { HALF, QUARTER, FULL } = WIDGET_WIDTHS;

function BoxesWidgets( { children } ) {
	return (
		<div className="mdc-layout-grid googlesitekit-widget-area googlesitekit-widget-area--boxes">
			<div className="googlesitekit-widget-area-widgets">
				<div className="mdc-layout-grid__inner">
					{ children }
				</div>
			</div>
		</div>
	);
}

function CompositeWidgets( { children } ) {
	return (
		<div className="mdc-layout-grid googlesitekit-widget-area googlesitekit-widget-area--composite">
			<div className="googlesitekit-widget-area-widgets">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								{ children }
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function QuarterWidgetInGrid( props ) {
	return (
		<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-3-desktop mdc-layout-grid__cell--span-4-tablet">
			<Widget { ...props } />
		</div>
	);
}

function getRegularWidget( textContent ) {
	return () => <div>{ textContent || 'Regular Widget' }</div>;
}

function getReportZeroWidget( moduleSlug ) {
	return ( { WidgetReportZero } ) => <WidgetReportZero moduleSlug={ moduleSlug } />;
}

function getActivateModuleCTAWidget( moduleSlug ) {
	return ( { WidgetActivateModuleCTA } ) => <WidgetActivateModuleCTA moduleSlug={ moduleSlug } />;
}

function getCompleteModuleActivationCTAWidget( moduleSlug ) {
	return ( { WidgetCompleteModuleActivationCTA } ) => <WidgetCompleteModuleActivationCTA moduleSlug={ moduleSlug } />;
}

function createWidgetAreasFromWidths( registry, ...widgetAreaWidgetWidths ) {
	const widgetAreaWidgets = widgetAreaWidgetWidths.map( ( widgetWidths ) => {
		return widgetWidths.map( ( width ) => ( { width } ) );
	} );
	return createWidgetAreas( registry, ...widgetAreaWidgets );
}

function createWidgetAreas( registry, ...widgetAreaWidgets ) {
	return widgetAreaWidgets.map( ( widgets, i ) => createWidgetArea(
		registry,
		`area${ i + 1 }`,
		widgets,
	) );
}

function createWidgetArea( registry, areaName, widgets ) {
	registry.dispatch( STORE_NAME ).registerWidgetArea( areaName, {
		title: areaName.toUpperCase(),
		subtitle: `${ areaName } subtitle`,
		style: WIDGET_AREA_STYLES.BOXES,
	} );

	widgets.forEach( ( { Component, slug, width }, i ) => {
		const widgetSlug = slug || `${ areaName }-widget${ i + 1 }`;
		const componentFallback = () => (
			<div>
				{ ( Array.isArray( width ) ? width.join( ' / ' ) : width ).toUpperCase() }
			</div>
		);

		registry.dispatch( STORE_NAME ).registerWidget( widgetSlug, {
			Component: Component || componentFallback,
			width,
		} );

		registry.dispatch( STORE_NAME ).assignWidget( widgetSlug, areaName );
	} );

	return <WidgetAreaRenderer slug={ areaName } key={ areaName } />;
}

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	provideUserCapabilities( registry );
	provideModules( registry );

	return (
		<WithTestRegistry registry={ registry }>
			<Story registry={ registry } />
		</WithTestRegistry>
	);
};

storiesOf( 'Global/Widgets', module )
	.add( 'Widgets in boxes layout', () => (
		<BoxesWidgets>
			{ [ 1, 2, 3, 4 ].map( ( count ) => (
				<QuarterWidgetInGrid
					key={ `widget${ count }` }
					widgetSlug={ `widget${ count }` }
				>
					{ count === 4 && <div>Widget with more body content.</div> }
					{ count !== 4 && <div>Widget body content.</div> }
				</QuarterWidgetInGrid>
			) ) }
		</BoxesWidgets>
	) )
	.add( 'Widgets in composite layout', () => (
		<CompositeWidgets>
			{ [ 1, 2, 3, 4 ].map( ( count ) => (
				<QuarterWidgetInGrid
					key={ `widget${ count }` }
					widgetSlug={ `widget${ count }` }
				>
					{ count === 4 && <div>Widget with more body content.</div> }
					{ count !== 4 && <div>Widget body content.</div> }
				</QuarterWidgetInGrid>
			) ) }
		</CompositeWidgets>
	) )
	.add( 'Widgets without padding in boxes layout', () => (
		<BoxesWidgets>
			{ [ 1, 2, 3, 4 ].map( ( count ) => (
				<QuarterWidgetInGrid
					key={ `widget${ count }` }
					widgetSlug={ `widget${ count }` }
					noPadding
				>
					{ count === 4 && <div>Widget with more body content.</div> }
					{ count !== 4 && <div>Widget body content.</div> }
				</QuarterWidgetInGrid>
			) ) }
		</BoxesWidgets>
	) )
	.add( 'Widgets without padding in composite layout', () => (
		<CompositeWidgets>
			{ [ 1, 2, 3, 4 ].map( ( count ) => (
				<QuarterWidgetInGrid
					key={ `widget${ count }` }
					widgetSlug={ `widget${ count }` }
					noPadding
				>
					{ count === 4 && <div>Widget with more body content.</div> }
					{ count !== 4 && <div>Widget body content.</div> }
				</QuarterWidgetInGrid>
			) ) }
		</CompositeWidgets>
	) )
	.add( 'Widgets with header and footer in boxes layout', () => (
		<BoxesWidgets>
			{ [ 1, 2, 3, 4 ].map( ( count ) => (
				<QuarterWidgetInGrid
					key={ `widget${ count }` }
					widgetSlug={ `widget${ count }` }
					Header={ () => <div>Widget header</div> }
					Footer={ () => <div>Widget footer</div> }
				>
					{ count === 4 && <div>Widget with more body content.</div> }
					{ count !== 4 && <div>Widget body content.</div> }
				</QuarterWidgetInGrid>
			) ) }
		</BoxesWidgets>
	) )
	.add( 'Widgets with header and footer in composite layout', () => (
		<CompositeWidgets>
			{ [ 1, 2, 3, 4 ].map( ( count ) => (
				<QuarterWidgetInGrid
					key={ `widget${ count }` }
					widgetSlug={ `widget${ count }` }
					Header={ () => <div>Widget header</div> }
					Footer={ () => <div>Widget footer</div> }
				>
					{ count === 4 && <div>Widget with more body content.</div> }
					{ count !== 4 && <div>Widget body content.</div> }
				</QuarterWidgetInGrid>
			) ) }
		</CompositeWidgets>
	) );

storiesOf( 'Global/Widgets/Widget Area', module )
	.add( 'Regular sizes', ( args, { registry } ) => (
		createWidgetAreasFromWidths(
			registry,
			[ QUARTER, QUARTER, QUARTER, QUARTER ],
			[ HALF, QUARTER, QUARTER ],
			[ QUARTER, HALF, QUARTER ],
			[ QUARTER, QUARTER, HALF ],
			[ HALF, HALF ],
			[ FULL ],
		)
	), {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Irregular sizes', ( args, { registry } ) => (
		createWidgetAreasFromWidths(
			registry,
			[ QUARTER, QUARTER, QUARTER, HALF, QUARTER ],
			[ QUARTER, QUARTER, HALF, [ QUARTER, FULL ] ],
			[ HALF, [ QUARTER, HALF ], FULL ],
			[ [ HALF, FULL ], QUARTER, QUARTER ],
			[ QUARTER, [ FULL, HALF ], QUARTER ],
			[ QUARTER, QUARTER, [ HALF, FULL ] ],
		)
	), {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Special combination states', ( args, { registry } ) => (
		createWidgetAreas(
			registry,
			[
				{
					Component: getRegularWidget(),
					width: QUARTER,
				},
				{
					Component: getReportZeroWidget( 'search-console' ),
					width: QUARTER,
				},
				{
					Component: getReportZeroWidget( 'analytics' ),
					width: QUARTER,
				},
				{
					Component: getActivateModuleCTAWidget( 'adsense' ),
					width: QUARTER,
				},
			],
			[
				{
					Component: getReportZeroWidget( 'search-console' ),
					width: QUARTER,
				},
				{
					Component: getReportZeroWidget( 'search-console' ),
					width: QUARTER,
				},
				{
					Component: getReportZeroWidget( 'analytics' ),
					width: QUARTER,
				},
				{
					Component: getReportZeroWidget( 'analytics' ),
					width: QUARTER,
				},
			],
			[
				{
					Component: getReportZeroWidget( 'search-console' ),
					width: HALF,
				},
				{
					Component: getActivateModuleCTAWidget( 'analytics' ),
					width: HALF,
				},
				{
					Component: getActivateModuleCTAWidget( 'analytics' ),
					width: HALF,
				},
				{
					Component: getActivateModuleCTAWidget( 'analytics' ),
					width: HALF,
				},
			],
			[
				{
					Component: getCompleteModuleActivationCTAWidget( 'search-console' ),
					width: HALF,
				},
				{
					Component: getCompleteModuleActivationCTAWidget( 'search-console' ),
					width: HALF,
				},
				{
					Component: getCompleteModuleActivationCTAWidget( 'search-console' ),
					width: QUARTER,
				},
				{
					Component: getCompleteModuleActivationCTAWidget( 'analytics' ),
					width: QUARTER,
				},
				{
					Component: getRegularWidget(),
					width: QUARTER,
				},
				{
					Component: getCompleteModuleActivationCTAWidget( 'analytics' ),
					width: QUARTER,
				},
			],
		)
	), {
		decorators: [
			withRegistry,
		],
	} );
