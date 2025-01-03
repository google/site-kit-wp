/**
 * WidgetAreaRenderer Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	provideModules,
	provideUserCapabilities,
} from '../../../../../tests/js/utils';
import WidgetAreaRenderer from './WidgetAreaRenderer';
import {
	CORE_WIDGETS,
	WIDGET_WIDTHS,
	WIDGET_AREA_STYLES,
} from '../datastore/constants';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
const { HALF, QUARTER, FULL } = WIDGET_WIDTHS;

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

	return areaName;
}

function Template( { totalWidgetAreas } ) {
	return Array.from( { length: totalWidgetAreas } ).map( ( _, i ) => (
		<WidgetAreaRenderer
			slug={ `area${ i + 1 }` }
			key={ `area${ i + 1 }` }
		/>
	) );
}

export const RegularSizes = Template.bind( {} );
RegularSizes.args = {
	registerWidgetAreas: ( registry ) => {
		createWidgetAreasFromWidths(
			registry,
			[ QUARTER, QUARTER, QUARTER, QUARTER ],
			[ HALF, QUARTER, QUARTER ],
			[ QUARTER, HALF, QUARTER ],
			[ QUARTER, QUARTER, HALF ],
			[ HALF, HALF ],
			[ FULL ]
		);
	},
	totalWidgetAreas: 6,
};

export const IrregularSizes = Template.bind( {} );
IrregularSizes.args = {
	registerWidgetAreas: ( registry ) => {
		createWidgetAreasFromWidths(
			registry,
			[ QUARTER, QUARTER, QUARTER, HALF, QUARTER ],
			[ QUARTER, QUARTER, HALF, [ QUARTER, FULL ] ],
			[ HALF, [ QUARTER, HALF ], FULL ],
			[ [ HALF, FULL ], QUARTER, QUARTER ],
			[ QUARTER, [ FULL, HALF ], QUARTER ],
			[ QUARTER, QUARTER, [ HALF, FULL ] ]
		);
	},
	totalWidgetAreas: 6,
};

export const SpecialCombinationStates = Template.bind( {} );
SpecialCombinationStates.args = {
	registerWidgetAreas: ( registry ) => {
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
					Component: getRecoverableModulesWidget( [ 'analytics-4' ] ),
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
		);
	},
	totalWidgetAreas: 4,
};

export default {
	title: 'Components/WidgetAreaRenderer',
	component: WidgetAreaRenderer,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideUserCapabilities( registry );
				provideModules( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
