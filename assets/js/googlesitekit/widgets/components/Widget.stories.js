/**
 * Widget Stories.
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
import Widget from './Widget';
import { Cell, Grid, Row } from '../../../material-components';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';

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

export function WidgetsInBoxesLayout() {
	return (
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
	);
}

export function WidgetsInCompositeLayout() {
	return (
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
	);
}

export function WidgetsWithoutPaddingInBoxesLayout() {
	return (
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
	);
}

export function WidgetsWithoutPaddingInCompositeLayout() {
	return (
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
	);
}

export function WidgetsWithHeaderAndFooterInBoxesLayout() {
	return (
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
	);
}

export function WidgetsWithHeaderAndFooterInCompositeLayout() {
	return (
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
	);
}

export default {
	title: 'Components/Widget',
	component: Widget,
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
