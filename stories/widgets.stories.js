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
import { Cell, Grid, Row } from '../assets/js/material-components';
import {
	CORE_WIDGETS,
	WIDGET_WIDTHS,
	WIDGET_AREA_STYLES,
} from '../assets/js/googlesitekit/widgets/datastore/constants';
const { HALF, QUARTER, FULL } = WIDGET_WIDTHS;

function BoxesWidgets( { children } ) {
	return (
		<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
			<Row className="googlesitekit-widget-area-widgets">
				{ children }
			</Row>
		</Grid>
	);
}

function CompositeWidgets( { children } ) {
	return (
		<Grid className="googlesitekit-widget-area googlesitekit-widget-area--composite">
			<Row className="googlesitekit-widget-area-widgets">
				<Cell size={ 12 }>
					<Grid>
						<Row>{ children }</Row>
					</Grid>
				</Cell>
			</Row>
		</Grid>
	);
}

function QuarterWidgetInGrid( props ) {
	return (
		<Cell mdSize={ 4 } lgSize={ 3 }>
			<Widget { ...props } />
		</Cell>
	);
}

function getRegularWidget( textContent ) {
	return function () {
		return <div>{ textContent || 'Regular Widget' }</div>;
	};
}

function getReportZeroWidget( moduleSlug ) {
	return function ( { WidgetReportZero } ) {
		return <WidgetReportZero moduleSlug={ moduleSlug } />;
	};
}

function getRecoverableModulesWidget( moduleSlugs ) {
	return function ( { WidgetRecoverableModules } ) {
		return <WidgetRecoverableModules moduleSlugs={ moduleSlugs } />;
	};
}

function createWidgetAreasFromWidths( registry, ...widgetAreaWidgetWidths ) {
	const widgetAreaWidgets = widgetAreaWidgetWidths.map( ( widgetWidths ) => {
		return widgetWidths.map( ( width ) => ( { width } ) );
	} );
	return createWidgetAreas( registry, ...widgetAreaWidgets );
}

function createWidgetAreas( registry, ...widgetAreaWidgets ) {
	return widgetAreaWidgets.map( ( widgets, i ) =>
		createWidgetArea( registry, `area${ i + 1 }`, widgets )
	);
}

function createWidgetArea( registry, areaName, widgets ) {
	registry.dispatch( CORE_WIDGETS ).registerWidgetArea( areaName, {
		title: areaName.toUpperCase(),
		subtitle: `${ areaName } subtitle`,
		style: WIDGET_AREA_STYLES.BOXES,
	} );

	widgets.forEach( ( { Component, slug, width }, i ) => {
		const widgetSlug = slug || `${ areaName }-widget${ i + 1 }`;
		const componentFallback = () => (
			<div>
				{ ( Array.isArray( width )
					? width.join( ' / ' )
					: width
				).toUpperCase() }
			</div>
		);

		registry.dispatch( CORE_WIDGETS ).registerWidget( widgetSlug, {
			Component: Component || componentFallback,
			width,
		} );

		registry.dispatch( CORE_WIDGETS ).assignWidget( widgetSlug, areaName );
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

storiesOf( 'Legacy/Global/Widgets', module )
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
	.add(
		'Regular sizes',
		( args, { registry } ) =>
			createWidgetAreasFromWidths(
				registry,
				[ QUARTER, QUARTER, QUARTER, QUARTER ],
				[ HALF, QUARTER, QUARTER ],
				[ QUARTER, HALF, QUARTER ],
				[ QUARTER, QUARTER, HALF ],
				[ HALF, HALF ],
				[ FULL ]
			),
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Irregular sizes',
		( args, { registry } ) =>
			createWidgetAreasFromWidths(
				registry,
				[ QUARTER, QUARTER, QUARTER, HALF, QUARTER ],
				[ QUARTER, QUARTER, HALF, [ QUARTER, FULL ] ],
				[ HALF, [ QUARTER, HALF ], FULL ],
				[ [ HALF, FULL ], QUARTER, QUARTER ],
				[ QUARTER, [ FULL, HALF ], QUARTER ],
				[ QUARTER, QUARTER, [ HALF, FULL ] ]
			),
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Special combination states',
		( args, { registry } ) =>
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
						Component: getReportZeroWidget( 'analytics-4' ),
						width: QUARTER,
					},
					{
						Component: getRecoverableModulesWidget( [
							'analytics-4',
						] ),
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
						Component: getReportZeroWidget( 'analytics-4' ),
						width: QUARTER,
					},
				],
				[
					{
						Component: getReportZeroWidget( 'search-console' ),
						width: HALF,
					},
					{
						Component: getReportZeroWidget( 'analytics-4' ),
						width: HALF,
					},
					{
						Component: getRecoverableModulesWidget( [
							'analytics-4',
							'search-console',
						] ),
						width: FULL,
					},
				],
				[
					{
						Component: getRegularWidget(),
						width: FULL,
					},
					{
						Component: getRegularWidget(),
						width: HALF,
					},
					{
						Component: getRegularWidget(),
						width: HALF,
					},
					{
						Component: getRegularWidget(),
						width: QUARTER,
					},
					{
						Component: getRegularWidget(),
						width: QUARTER,
					},
					{
						Component: getRegularWidget(),
						width: QUARTER,
					},
					{
						Component: getRegularWidget(),
						width: QUARTER,
					},
				]
			),
		{
			decorators: [ withRegistry ],
		}
	);
