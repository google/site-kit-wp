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

/**
 * Gets color themes supported by Thank with Google.
 *
 * @since n.e.x.t
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
