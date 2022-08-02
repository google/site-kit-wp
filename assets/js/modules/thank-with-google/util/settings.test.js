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
	CTA_PLACEMENT_STATIC_AUTO,
	CTA_PLACEMENT_STATIC_ABOVE_CONTENT,
	CTA_PLACEMENT_STATIC_BELOW_CONTENT,
	CTA_PLACEMENT_DYNAMIC_HIGH,
	CTA_PLACEMENT_DYNAMIC_LOW,
	CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
} from '../datastore/constants';
import { getType, getProminence, getCTAPostTypesString } from './settings';

describe( 'getType', () => {
	it.each( [
		CTA_PLACEMENT_STATIC_AUTO,
		CTA_PLACEMENT_STATIC_ABOVE_CONTENT,
		CTA_PLACEMENT_STATIC_BELOW_CONTENT,
		CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
	] )( 'should return "Fixed" for %s button placement', ( ctaPlacement ) => {
		expect( getType( ctaPlacement ) ).toBe( 'Fixed' );
	} );

	it.each( [ CTA_PLACEMENT_DYNAMIC_HIGH, CTA_PLACEMENT_DYNAMIC_LOW ] )(
		'should return "Overlay" for %s',
		( ctaPlacement ) => {
			expect( getType( ctaPlacement ) ).toBe( 'Overlay' );
		}
	);

	it.each( [ undefined, null, '' ] )(
		'should return "" for %s',
		( ctaPlacement ) => {
			expect( getType( ctaPlacement ) ).toBe( '' );
		}
	);
} );

describe( 'getProminence', () => {
	it.each( [
		[ CTA_PLACEMENT_STATIC_AUTO, 'Auto' ],
		[ CTA_PLACEMENT_STATIC_ABOVE_CONTENT, 'Above the post' ],
		[ CTA_PLACEMENT_STATIC_BELOW_CONTENT, 'Below the post' ],
		[ CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH, 'Below the 1st paragraph' ],
		[ CTA_PLACEMENT_DYNAMIC_HIGH, 'High' ],
		[ CTA_PLACEMENT_DYNAMIC_LOW, 'Low' ],
	] )(
		'for %s button placement should return %s',
		( ctaPlacement, expected ) => {
			expect( getProminence( ctaPlacement ) ).toBe( expected );
		}
	);

	it.each( [ [ null ], [ undefined ], [ '' ] ] )(
		'should return an empty string when button placement is %s',
		( ctaPlacement ) => {
			expect( getProminence( ctaPlacement ) ).toBe( '' );
		}
	);
} );

describe( 'getCTAPostTypesString', () => {
	it( 'returns postType labels for ctaPostTypes settings slugs', () => {
		const ctaPostTypes = [ 'post', 'page' ];
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

		expect( getCTAPostTypesString( ctaPostTypes, postTypes ) ).toBe(
			'Posts, Pages'
		);
	} );

	it( 'returns "All post types" if ctaPostTypes cover all postTypes', () => {
		const ctaPostTypes = [ 'post', 'page', 'attachment' ];
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

		expect( getCTAPostTypesString( ctaPostTypes, postTypes ) ).toBe(
			'All post types'
		);
	} );

	it.each( [ null, undefined, [] ] )(
		'should return ctaPostTypes slugs when postTypes is %s',
		( postTypes ) => {
			expect(
				getCTAPostTypesString( [ 'post', 'page' ], postTypes )
			).toBe( 'post, page' );
		}
	);

	it( 'returns an empty string if ctaPostTypes is empty', () => {
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

		expect( getCTAPostTypesString( [], postTypes ) ).toBe( '' );
	} );
} );
