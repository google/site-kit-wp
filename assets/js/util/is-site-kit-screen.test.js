/**
 * Tests for isSiteKitScreen.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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

import { isSiteKitScreen } from './is-site-kit-screen';
import {
	VIEW_CONTEXT_DASHBOARD,
	VIEW_CONTEXT_PAGE_DASHBOARD,
	VIEW_CONTEXT_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_PAGE_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_POSTS_LIST,
	VIEW_CONTEXT_USER_INPUT,
	VIEW_CONTEXT_ACTIVATION,
	VIEW_CONTEXT_DASHBOARD_SPLASH,
	VIEW_CONTEXT_ADMIN_BAR,
	VIEW_CONTEXT_SETTINGS,
	VIEW_CONTEXT_MODULE,
	VIEW_CONTEXT_WP_DASHBOARD,
	VIEW_CONTEXT_MODULE_SETUP,
} from '../googlesitekit/constants';

describe( 'isSiteKitScreen', () => {
	it( 'should return true for Site Kit screens', () => {
		expect( isSiteKitScreen( VIEW_CONTEXT_DASHBOARD ) ).toBe( true );
		expect( isSiteKitScreen( VIEW_CONTEXT_PAGE_DASHBOARD ) ).toBe( true );
		expect( isSiteKitScreen( VIEW_CONTEXT_DASHBOARD_VIEW_ONLY ) ).toBe(
			true
		);
		expect( isSiteKitScreen( VIEW_CONTEXT_PAGE_DASHBOARD_VIEW_ONLY ) ).toBe(
			true
		);
		expect( isSiteKitScreen( VIEW_CONTEXT_USER_INPUT ) ).toBe( true );
		expect( isSiteKitScreen( VIEW_CONTEXT_DASHBOARD_SPLASH ) ).toBe( true );
		expect( isSiteKitScreen( VIEW_CONTEXT_SETTINGS ) ).toBe( true );
		expect( isSiteKitScreen( VIEW_CONTEXT_MODULE_SETUP ) ).toBe( true );
	} );

	it( 'should return false for view contexts that are not Site Kit screens', () => {
		expect( isSiteKitScreen( VIEW_CONTEXT_POSTS_LIST ) ).toBe( false );
		expect( isSiteKitScreen( VIEW_CONTEXT_ACTIVATION ) ).toBe( false );
		expect( isSiteKitScreen( VIEW_CONTEXT_ADMIN_BAR ) ).toBe( false );
		expect( isSiteKitScreen( VIEW_CONTEXT_MODULE ) ).toBe( false );
		expect( isSiteKitScreen( VIEW_CONTEXT_WP_DASHBOARD ) ).toBe( false );
	} );

	it( 'should return false for values other than Site Kit screen context constans', () => {
		expect( isSiteKitScreen( 'foo' ) ).toBe( false );
		expect( isSiteKitScreen( null ) ).toBe( false );
		expect( isSiteKitScreen( undefined ) ).toBe( false );
		expect( isSiteKitScreen( 0 ) ).toBe( false );
		expect( isSiteKitScreen( 1 ) ).toBe( false );
		expect( isSiteKitScreen( true ) ).toBe( false );
		expect( isSiteKitScreen( false ) ).toBe( false );
		expect( isSiteKitScreen( {} ) ).toBe( false );
		expect( isSiteKitScreen( [] ) ).toBe( false );
		expect( isSiteKitScreen( function () {} ) ).toBe( false );
	} );
} );
