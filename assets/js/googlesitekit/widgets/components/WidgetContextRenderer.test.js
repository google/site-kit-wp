/**
 * WidgetContextRenderer component tests.
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
import WidgetContextRenderer from './WidgetContextRenderer';
import { CORE_WIDGETS } from '../datastore/constants';
import {
	createTestRegistry,
	provideModules,
	render,
	waitFor,
} from '../../../../../tests/js/test-utils';

function WidgetComponent() {
	return <div>Foo bar!</div>;
}

function WidgetComponentEmpty( { WidgetNull } ) {
	return <WidgetNull />;
}

describe( 'WidgetContextRenderer', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );

		// Register a widget area.
		registry.dispatch( CORE_WIDGETS ).registerWidgetArea( 'TestArea1', {
			title: 'Dashboard Header',
			subtitle: 'Cool stuff for yoursite.com',
			style: 'composite',
		} );

		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea( 'TestArea1', 'TestContext' );
	} );

	it( 'should render the registered widget areas', async () => {
		// Register a second widget area.
		registry.dispatch( CORE_WIDGETS ).registerWidgetArea( 'TestArea2', {
			title: 'Dashboard Body',
			subtitle: 'More cool stuff for yoursite.com',
			style: 'composite',
		} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea( 'TestArea2', 'TestContext' );

		// Register active widgets in the areas.
		registry.dispatch( CORE_WIDGETS ).registerWidget( 'TestWidget1', {
			Component: WidgetComponent,
			width: 'full',
		} );
		registry.dispatch( CORE_WIDGETS ).registerWidget( 'TestWidget2', {
			Component: WidgetComponent,
			width: 'full',
		} );

		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'TestWidget1', 'TestArea1' );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'TestWidget2', 'TestArea2' );

		const { container, waitForRegistry } = render(
			<WidgetContextRenderer slug="TestContext" />,
			{ registry }
		);

		await waitForRegistry();

		await waitFor( () => {
			expect(
				container.querySelectorAll( '.googlesitekit-widget-context' )
			).toHaveLength( 1 );
			expect(
				container.querySelector( '.googlesitekit-widget-context' )
			).toMatchSnapshot();
		} );
	} );

	it( 'should render a hidden widget context when it has no active area', async () => {
		// Register an inactive widget in the area.
		registry.dispatch( CORE_WIDGETS ).registerWidget( 'TestWidget1', {
			Component: WidgetComponentEmpty,
			width: 'full',
		} );

		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( 'TestWidget1', 'TestArea1' );

		const { container } = render(
			<WidgetContextRenderer slug="TestContext" />,
			{ registry }
		);

		await waitFor( () => {
			expect(
				container.querySelectorAll( '.googlesitekit-widget-context' )
			).toHaveLength( 1 );
			expect(
				container.querySelector( '.googlesitekit-widget-context' )
			).toHaveClass( 'googlesitekit-hidden' );
		} );
	} );
} );
