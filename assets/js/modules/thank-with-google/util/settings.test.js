/**
 * Tests for settings utilities.
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

/**
 * Internal dependencies
 */
import {
	BUTTON_PLACEMENT_STATIC_AUTO,
	BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT,
	BUTTON_PLACEMENT_STATIC_BELOW_CONTENT,
	BUTTON_PLACEMENT_DYNAMIC_HIGH,
	BUTTON_PLACEMENT_DYNAMIC_LOW,
	BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
} from '../datastore/constants';
import { getType, getProminence, getButtonPostTypesString } from './settings';

describe( 'getType', () => {
	it.each( [
		BUTTON_PLACEMENT_STATIC_AUTO,
		BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT,
		BUTTON_PLACEMENT_STATIC_BELOW_CONTENT,
		BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
	] )(
		'should return "Fixed" for %s button placement',
		( buttonPlacement ) => {
			expect( getType( buttonPlacement ) ).toBe( 'Fixed' );
		}
	);

	it.each( [ BUTTON_PLACEMENT_DYNAMIC_HIGH, BUTTON_PLACEMENT_DYNAMIC_LOW ] )(
		'should return "Overlay" for %s',
		( buttonPlacement ) => {
			expect( getType( buttonPlacement ) ).toBe( 'Overlay' );
		}
	);

	it.each( [ undefined, null, '' ] )(
		'should return "" for %s',
		( buttonPlacement ) => {
			expect( getType( buttonPlacement ) ).toBe( '' );
		}
	);
} );

describe( 'getProminence', () => {
	it.each( [
		[ BUTTON_PLACEMENT_STATIC_AUTO, 'Auto' ],
		[ BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT, 'Above the post' ],
		[ BUTTON_PLACEMENT_STATIC_BELOW_CONTENT, 'Below the post' ],
		[
			BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
			'Below the 1st paragraph',
		],
		[ BUTTON_PLACEMENT_DYNAMIC_HIGH, 'High' ],
		[ BUTTON_PLACEMENT_DYNAMIC_LOW, 'Low' ],
	] )(
		'for %s button placement should return %s',
		( buttonPlacement, expected ) => {
			expect( getProminence( buttonPlacement ) ).toBe( expected );
		}
	);

	it.each( [ [ null ], [ undefined ], [ '' ] ] )(
		'should return an empty string when button placement is %s',
		( buttonPlacement ) => {
			expect( getProminence( buttonPlacement ) ).toBe( '' );
		}
	);
} );

describe( 'getButtonPostTypesString', () => {
	it( 'returns postType labels for buttonPostTypes settings slugs', () => {
		const buttonPostTypes = [ 'post', 'page' ];
		const postTypes = [
			{
				slug: 'post',
				label: 'Posts',
			},
			{
				slug: 'page',
				label: 'Pages',
			},
			{
				slug: 'attachment',
				label: 'Media',
			},
		];

		expect( getButtonPostTypesString( buttonPostTypes, postTypes ) ).toBe(
			'Posts, Pages'
		);
	} );

	it( 'returns "All post types" if buttonPostTypes cover all postTypes', () => {
		const buttonPostTypes = [ 'post', 'page', 'attachment' ];
		const postTypes = [
			{
				slug: 'post',
				label: 'Posts',
			},
			{
				slug: 'page',
				label: 'Pages',
			},
			{
				slug: 'attachment',
				label: 'Media',
			},
		];

		expect( getButtonPostTypesString( buttonPostTypes, postTypes ) ).toBe(
			'All post types'
		);
	} );

	it.each( [ null, undefined, [] ] )(
		'should return buttonPostTypes slugs when postTypes is %s',
		( postTypes ) => {
			expect(
				getButtonPostTypesString( [ 'post', 'page' ], postTypes )
			).toBe( 'post, page' );
		}
	);

	it( 'returns an empty string if buttonPostTypes is empty', () => {
		const postTypes = [
			{
				slug: 'post',
				label: 'Posts',
			},
			{
				slug: 'page',
				label: 'Pages',
			},
		];

		expect( getButtonPostTypesString( [], postTypes ) ).toBe( '' );
	} );
} );
