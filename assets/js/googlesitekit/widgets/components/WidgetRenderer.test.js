/**
 * WidgetRenderer component tests.
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
 * Internal dependencies
 */
import WidgetRenderer from './WidgetRenderer';
import { STORE_NAME } from '../datastore/constants';
import { render } from '../../../../../tests/js/test-utils';

const setupRegistry = ( { Component = () => <div>Test</div>, wrapWidget = false } = {} ) => {
	return ( { dispatch } ) => {
		dispatch( STORE_NAME ).registerWidgetArea( 'dashboard-header', {
			title: 'Dashboard Header',
			subtitle: 'Cool stuff for yoursite.com',
			style: 'boxes',
		} );
		dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );
		dispatch( STORE_NAME ).registerWidget( 'TestWidget', {
			Component,
			wrapWidget,
		} );
		dispatch( STORE_NAME ).assignWidget( 'TestWidget', 'dashboard-header' );
	};
};

describe( 'WidgetRenderer', () => {
	it( 'should output children directly', async () => {
		const { container } = render( <WidgetRenderer slug="TestWidget" />, { setupRegistry: setupRegistry() } );

		expect( Object.values( container.firstChild.classList ) ).toEqual( [] );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	it( 'should wrap children when wrapWidget is true', () => {
		const { container } = render( <WidgetRenderer slug="TestWidget" />, { setupRegistry: setupRegistry( { wrapWidget: true } ) } );

		expect( Object.values( container.firstChild.classList ) ).toEqual( [
			'googlesitekit-widget',
			'googlesitekit-widget--TestWidget',
		] );

		expect( container.firstChild ).toMatchSnapshot();
	} );

	it( 'should output null when no slug is found', async () => {
		const { container } = render( <WidgetRenderer slug="NotFound" />, { setupRegistry: setupRegistry() } );

		expect( container.firstChild ).toEqual( null );
	} );
} );
