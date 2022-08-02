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
	BUTTON_PLACEMENT_STATIC_AUTO,
	BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT,
	BUTTON_PLACEMENT_STATIC_BELOW_CONTENT,
	BUTTON_PLACEMENT_DYNAMIC_HIGH,
	BUTTON_PLACEMENT_DYNAMIC_LOW,
	BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
} from '../datastore/constants';

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
 * Gets the type value based on the buttonPlacement setting.
 *
 * @since n.e.x.t
 *
 * @param {string} buttonPlacement The buttonPlacement setting value.
 * @return {string} "Fixed" or "Overlay" depending on if buttonPlacement is static or dynamic.
 */
export const getType = ( buttonPlacement ) => {
	if ( ! buttonPlacement ) {
		return '';
	}
	if ( 'static' === buttonPlacement.substring( 0, 6 ) ) {
		return __( 'Fixed', 'google-site-kit' );
	}
	return __( 'Overlay', 'google-site-kit' );
};

/**
 * Gets the prominence value based on the buttonPlacement setting.
 *
 * @since n.e.x.t
 *
 * @param {string} buttonPlacement The buttonPlacement setting value.
 * @return {string} Prominence value depending on the buttonPlacement setting.
 */
export const getProminence = ( buttonPlacement ) => {
	switch ( buttonPlacement ) {
		case BUTTON_PLACEMENT_STATIC_AUTO:
			return __( 'Auto', 'google-site-kit' );
		case BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT:
			return __( 'Above the post', 'google-site-kit' );
		case BUTTON_PLACEMENT_STATIC_BELOW_CONTENT:
			return __( 'Below the post', 'google-site-kit' );
		case BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH:
			return __( 'Below the 1st paragraph', 'google-site-kit' );
		case BUTTON_PLACEMENT_DYNAMIC_HIGH:
			return __( 'High', 'google-site-kit' );
		case BUTTON_PLACEMENT_DYNAMIC_LOW:
			return __( 'Low', 'google-site-kit' );
		default:
			return '';
	}
};

/**
 * Gets the formatted list of button post types based on the buttonPostTypes slugs
 * stored in settings.
 *
 * @since n.e.x.t
 *
 * @param {string} buttonPostTypes The buttonPostTypes setting value.
 * @param {string} postTypes       All available public postTypes.
 * @return {string} Formatted string of buttonPostTypes.
 */
export const getButtonPostTypesString = ( buttonPostTypes, postTypes ) => {
	const enabledPostTypes = postTypes.filter( ( postType ) =>
		buttonPostTypes.includes( postType.slug )
	);
	if ( enabledPostTypes.length === postTypes.length ) {
		return __( 'All post types', 'google-site-kit' );
	}
	return enabledPostTypes.map( ( postType ) => postType.label ).join( ', ' );
};
