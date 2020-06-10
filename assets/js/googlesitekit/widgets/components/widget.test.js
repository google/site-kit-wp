/**
 * Widget component tests.
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
import Widget from './widget';
import { STORE_NAME } from '../datastore/constants';
import { render } from '../../../../../tests/js/test-utils';

const setupRegistry = ( { dispatch } ) => {
	dispatch( STORE_NAME ).registerWidgetArea( 'dashboard-header', {
		title: 'Dashboard Header',
		subtitle: 'Cool stuff for yoursite.com',
		style: 'boxes',
	} );
	dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );
	dispatch( STORE_NAME ).registerWidget( 'PageViews', {
		component: () => <div>Test</div>,
		useWrapper: true,
	} );
	dispatch( STORE_NAME ).assignWidget( 'PageViews', 'dashboard-header' );
};

const setupRegistryWithoutWrapperWidget = ( { dispatch } ) => {
	dispatch( STORE_NAME ).registerWidgetArea( 'dashboard-header', {
		title: 'Dashboard Header',
		subtitle: 'Cool stuff for yoursite.com',
		style: 'boxes',
	} );
	dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );
	dispatch( STORE_NAME ).registerWidget( 'NoWrap', {
		component: () => <div>Test</div>,
		useWrapper: false,
	} );
	dispatch( STORE_NAME ).assignWidget( 'NoWrap', 'dashboard-header' );
};

describe( 'Widget', () => {
	it( 'should wrap children in a WidgetWrapper component if useWrapper is true', async () => {
		const { container } = render( <Widget slug="PageViews" />, { setupRegistry } );

		expect( Object.values( container.firstChild.classList ) ).toMatchObject( [ 'WidgetWrapper', 'WidgetWrapper--PageViews' ] );
		expect( container.firstChild ).toMatchSnapshot();
	} );

	it( 'should output children directly if useWrapper is false', async () => {
		const { container } = render( <Widget slug="NoWrap" />, { setupRegistry: setupRegistryWithoutWrapperWidget } );

		expect( Object.values( container.firstChild.classList ) ).toEqual( [] );
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
