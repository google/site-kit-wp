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
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_POSTS_LIST,
	VIEW_CONTEXT_USER_INPUT,
	VIEW_CONTEXT_ACTIVATION,
	VIEW_CONTEXT_SPLASH,
	VIEW_CONTEXT_ADMIN_BAR,
	VIEW_CONTEXT_SETTINGS,
	VIEW_CONTEXT_MODULE,
	VIEW_CONTEXT_WP_DASHBOARD,
	VIEW_CONTEXT_MODULE_SETUP,
} from '../googlesitekit/constants';

describe( 'isSiteKitScreen', () => {
	it.each( [
		[ 'VIEW_CONTEXT_MAIN_DASHBOARD', VIEW_CONTEXT_MAIN_DASHBOARD ],
		[ 'VIEW_CONTEXT_ENTITY_DASHBOARD', VIEW_CONTEXT_ENTITY_DASHBOARD ],
		[
			'VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY',
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		[
			'VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY',
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
		],
		[ 'VIEW_CONTEXT_USER_INPUT', VIEW_CONTEXT_USER_INPUT ],
		[ 'VIEW_CONTEXT_SPLASH', VIEW_CONTEXT_SPLASH ],
		[ 'VIEW_CONTEXT_SETTINGS', VIEW_CONTEXT_SETTINGS ],
		[ 'VIEW_CONTEXT_MODULE_SETUP', VIEW_CONTEXT_MODULE_SETUP ],
	] )( 'should return TRUE for %s screen', ( _, screen ) => {
		expect( isSiteKitScreen( screen ) ).toBe( true );
	} );

	it.each( [
		[ 'VIEW_CONTEXT_POSTS_LIST', VIEW_CONTEXT_POSTS_LIST ],
		[ 'VIEW_CONTEXT_ACTIVATION', VIEW_CONTEXT_ACTIVATION ],
		[ 'VIEW_CONTEXT_ADMIN_BAR', VIEW_CONTEXT_ADMIN_BAR ],
		[ 'VIEW_CONTEXT_MODULE', VIEW_CONTEXT_MODULE ],
		[ 'VIEW_CONTEXT_WP_DASHBOARD', VIEW_CONTEXT_WP_DASHBOARD ],
	] )( 'should return FALSE for %s screen', ( _, screen ) => {
		expect( isSiteKitScreen( screen ) ).toBe( false );
	} );

	it.each( [
		[ 'String "foo"', 'foo' ],
		[ 'Number 0', 0 ],
		[ 'Number 1', 1 ],
		[ 'Boolean true', true ],
		[ 'Boolean false', false ],
		[ 'Null', null ],
		[ 'Undefined', undefined ],
		[ 'Object', {} ],
		[ 'Array', [] ],
		[ 'Function', function () {} ],
	] )( 'should return FALSE for %s', ( _, screen ) => {
		expect( isSiteKitScreen( screen ) ).toBe( false );
	} );
} );
