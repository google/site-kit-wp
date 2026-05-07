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
 * External dependencies
 */
import { FC } from 'react';

/**
 * Internal dependencies
 */
import {
	provideModules,
	provideUserCapabilities,
} from '../../../../../tests/js/utils';
import Widget, { WidgetProps } from './Widget';
import { Cell, Grid, Row } from '@/js/material-components';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { Story as StoryType } from '@/js/types/Story';
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

const BoxesWidgets: FC = ( { children } ) => {
	return (
		<Grid className="googlesitekit-widget-area googlesitekit-widget-area--boxes">
			<Row className="googlesitekit-widget-area-widgets">
				{ children }
			</Row>
		</Grid>
	);
};

const CompositeWidgets: FC = ( { children } ) => {
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
};

const QuarterWidgetInGrid: FC< WidgetProps > = ( props ) => {
	return (
		<Cell mdSize={ 4 } lgSize={ 3 }>
			<Widget { ...props } />
		</Cell>
	);
};

export const WidgetsInBoxesLayout: FC = () => {
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
};

export const WidgetWithCollapsibleHeader: FC = () => {
	return (
		<BoxesWidgets>
			<Cell mdSize={ 8 } lgSize={ 12 }>
				<Widget
					collapsibleTitle="Collapsible Widget"
					Header={ ( { children } = {} ) => <div>{ children }</div> }
					widgetSlug="widget-lorem"
					collapsible
				>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
					do eiusmod tempor incididunt ut labore et dolore magna
					aliqua. Ut enim ad minim veniam, quis nostrud exercitation
					ullamco laboris nisi ut aliquip ex ea commodo consequat.
					Duis aute irure dolor in reprehenderit in voluptate velit
					esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
					occaecat cupidatat non proident, sunt in culpa qui officia
					deserunt mollit anim id est laborum.
				</Widget>
			</Cell>
		</BoxesWidgets>
	);
};

export const WidgetsInCompositeLayout: FC = () => {
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
};

export const WidgetsWithCollapsibleHeaderInCompositeLayout: FC = () => {
	return (
		<CompositeWidgets>
			{ [ 1, 2, 3, 4 ].map( ( count ) => (
				<Cell mdSize={ 8 } lgSize={ 12 } key={ `widget${ count }` }>
					<Widget
						collapsibleTitle={ `Collapsible Widget Header #${ count }` }
						Header={ ( { children } = {} ) => (
							<div>{ children }</div>
						) }
						widgetSlug={ `widget${ count }` }
						collapsible
					>
						{ count === 4 && (
							<div>Widget with more body content.</div>
						) }
						{ count !== 4 && <div>Widget body content.</div> }
					</Widget>
				</Cell>
			) ) }
		</CompositeWidgets>
	);
};

export const WidgetsWithoutPaddingInBoxesLayout: FC = () => {
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
};

export const WidgetsWithoutPaddingInCompositeLayout: FC = () => {
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
};

export const WidgetsWithHeaderAndFooterInBoxesLayout: FC = () => {
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
};

export const WidgetsWithHeaderAndFooterInCompositeLayout: FC = () => {
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
};

export default {
	title: 'Components/Widget',
	component: Widget,
	decorators: [
		( Story: StoryType ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				provideUserCapabilities( registry );
				provideModules( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
