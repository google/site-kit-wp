/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import { createTestRegistry, WithTestRegistry } from '../tests/js/utils';
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

function createWidgetAreas( registry, ...widgets ) {
	return widgets.map( ( widths, i ) => createWidgetArea(
		registry,
		`area${ i + 1 }`,
		widths.map( ( width ) => ( { width } ) ),
	) );
}

function createWidgetArea( registry, areaName, widgets ) {
	registry.dispatch( STORE_NAME ).registerWidgetArea( areaName, {
		title: areaName.toUpperCase(),
		subtitle: `${ areaName } subtitle`,
		style: WIDGET_AREA_STYLES.BOXES,
	} );

	widgets.forEach( ( { component, slug, width }, i ) => {
		const widgetSlug = slug || ( areaName + i );
		const componentFallback = () => (
			<div>
				{ ( Array.isArray( width ) ? width.join( ' / ' ) : width ).toUpperCase() }
			</div>
		);

		registry.dispatch( STORE_NAME ).registerWidget( widgetSlug, {
			component: component || componentFallback,
			width,
		} );

		registry.dispatch( STORE_NAME ).assignWidget( widgetSlug, areaName );
	} );

	return <WidgetAreaRenderer slug={ areaName } key={ areaName } />;
}

storiesOf( 'Global/Widgets', module )
	.add( 'Widgets in boxes layout', () => (
		<BoxesWidgets>
			{ [ 1, 2, 3, 4 ].map( ( count ) => (
				<QuarterWidgetInGrid
					key={ `widget${ count }` }
					slug={ `widget${ count }` }
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
					slug={ `widget${ count }` }
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
					slug={ `widget${ count }` }
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
					slug={ `widget${ count }` }
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
					slug={ `widget${ count }` }
					header={ () => <div>Widget header</div> }
					footer={ () => <div>Widget footer</div> }
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
					slug={ `widget${ count }` }
					header={ () => <div>Widget header</div> }
					footer={ () => <div>Widget footer</div> }
				>
					{ count === 4 && <div>Widget with more body content.</div> }
					{ count !== 4 && <div>Widget body content.</div> }
				</QuarterWidgetInGrid>
			) ) }
		</CompositeWidgets>
	) );

storiesOf( 'Global/Widgets/Widget Area', module )
	.addDecorator( ( storyFn ) => storyFn( createTestRegistry() ) )
	.add( 'Regular sizes', ( registry ) => (
		<WithTestRegistry registry={ registry }>
			{ createWidgetAreas(
				registry,
				[ QUARTER, QUARTER, QUARTER, QUARTER ],
				[ HALF, QUARTER, QUARTER ],
				[ QUARTER, HALF, QUARTER ],
				[ QUARTER, QUARTER, HALF ],
				[ HALF, HALF ],
				[ FULL ],
			) }
		</WithTestRegistry>
	) )
	.add( 'Irregular sizes', ( registry ) => (
		<WithTestRegistry registry={ registry }>
			{ createWidgetAreas(
				registry,
				[ QUARTER, QUARTER, HALF, [ QUARTER, FULL ] ],
				[ [ HALF, FULL ], QUARTER, QUARTER ],
				[ QUARTER, [ FULL, HALF ], QUARTER ],
				[ QUARTER, QUARTER, [ HALF, FULL ] ],
			) }
		</WithTestRegistry>
	) )
;
