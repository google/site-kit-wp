/**
 * Settings utilities.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlueSVG from '../../../../svg/graphics/twg-blue.svg';
import CyanSVG from '../../../../svg/graphics/twg-cyan.svg';
import GreenSVG from '../../../../svg/graphics/twg-green.svg';
import PurpleSVG from '../../../../svg/graphics/twg-purple.svg';
import PinkSVG from '../../../../svg/graphics/twg-pink.svg';
import OrangeSVG from '../../../../svg/graphics/twg-orange.svg';
import BrownSVG from '../../../../svg/graphics/twg-brown.svg';
import BlackSVG from '../../../../svg/graphics/twg-black.svg';
import {
	CTA_PLACEMENT_STATIC_AUTO,
	CTA_PLACEMENT_STATIC_ABOVE_CONTENT,
	CTA_PLACEMENT_STATIC_BELOW_CONTENT,
	CTA_PLACEMENT_DYNAMIC_HIGH,
	CTA_PLACEMENT_DYNAMIC_LOW,
	CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
} from '../datastore/constants';

export const TYPE_OVERLAY = 'overlay';
export const TYPE_FIXED = 'fixed';

/**
 * Gets color themes supported by Thank with Google.
 *
 * @since 1.80.0
 *
 * @return {Array.<Object>} Color themes array.
 */
export function getColorThemes() {
	return [
		{
			colorThemeID: 'blue',
			name: __( 'Blue', 'google-site-kit' ),
			svg: BlueSVG,
		},
		{
			colorThemeID: 'cyan',
			name: __( 'Cyan', 'google-site-kit' ),
			svg: CyanSVG,
		},
		{
			colorThemeID: 'green',
			name: __( 'Green', 'google-site-kit' ),
			svg: GreenSVG,
		},
		{
			colorThemeID: 'purple',
			name: __( 'Purple', 'google-site-kit' ),
			svg: PurpleSVG,
		},
		{
			colorThemeID: 'pink',
			name: __( 'Pink', 'google-site-kit' ),
			svg: PinkSVG,
		},
		{
			colorThemeID: 'orange',
			name: __( 'Orange', 'google-site-kit' ),
			svg: OrangeSVG,
		},
		{
			colorThemeID: 'brown',
			name: __( 'Brown', 'google-site-kit' ),
			svg: BrownSVG,
		},
		{
			colorThemeID: 'black',
			name: __( 'Black', 'google-site-kit' ),
			svg: BlackSVG,
		},
	];
}

/**
 * Gets the placement type label based on the ctaPlacement setting.
 *
 * @since 1.81.0
 *
 * @param {string} ctaPlacement The ctaPlacement setting value.
 * @return {string} "Fixed" or "Overlay" depending on if ctaPlacement is static or dynamic.
 */
export function getPlacementTypeLabel( ctaPlacement ) {
	switch ( getPlacementType( ctaPlacement ) ) {
		case 'fixed':
			return __( 'Fixed', 'google-site-kit' );
		case 'overlay':
			return __( 'Overlay', 'google-site-kit' );
		default:
			return '';
	}
}

/**
 * Gets the prominence value based on the ctaPlacement setting.
 *
 * @since 1.81.0
 *
 * @param {string} ctaPlacement The ctaPlacement setting value.
 * @return {string} Prominence value depending on the ctaPlacement setting.
 */
export function getProminence( ctaPlacement ) {
	switch ( ctaPlacement ) {
		case CTA_PLACEMENT_STATIC_AUTO:
			return __( 'Auto', 'google-site-kit' );
		case CTA_PLACEMENT_STATIC_ABOVE_CONTENT:
			return __( 'Above the post', 'google-site-kit' );
		case CTA_PLACEMENT_STATIC_BELOW_CONTENT:
			return __( 'Below the post', 'google-site-kit' );
		case CTA_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH:
			return __( 'Below the 1st paragraph', 'google-site-kit' );
		case CTA_PLACEMENT_DYNAMIC_HIGH:
			return __( 'High', 'google-site-kit' );
		case CTA_PLACEMENT_DYNAMIC_LOW:
			return __( 'Low', 'google-site-kit' );
		default:
			return '';
	}
}

/**
 * Gets the formatted list of cta post types based on the ctaPostTypes slugs
 * stored in settings.
 *
 * @since 1.81.0
 *
 * @param {Array} ctaPostTypes The ctaPostTypes setting value.
 * @param {Array} postTypes    All available public postTypes.
 * @return {string} Formatted string of ctaPostTypes.
 */
export function getCTAPostTypesString( ctaPostTypes, postTypes ) {
	if ( ! postTypes || postTypes.length === 0 ) {
		return ctaPostTypes.join( ', ' );
	}

	const enabledPostTypes = postTypes.filter( ( postType ) =>
		ctaPostTypes.includes( postType.slug )
	);

	if ( enabledPostTypes.length === postTypes.length ) {
		return __( 'All post types', 'google-site-kit' );
	}
	return enabledPostTypes.map( ( postType ) => postType.label ).join( ', ' );
}

/**
 * Gets the placement type based on the ctaPlacement setting.
 *
 * @since n.e.x.t
 *
 * @param {string} ctaPlacement The ctaPlacement setting value.
 * @return {string} "fixed" or "overlay" depending on if ctaPlacement is static or dynamic.
 */
export function getPlacementType( ctaPlacement ) {
	if ( ! ctaPlacement ) {
		return null;
	}

	if ( 'static' === ctaPlacement.substring( 0, 6 ) ) {
		return TYPE_FIXED;
	}

	return TYPE_OVERLAY;
}
