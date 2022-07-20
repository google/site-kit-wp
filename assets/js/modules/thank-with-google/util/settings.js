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
			svg: '',
		},
		{
			colorThemeID: 'cyan',
			name: __( 'Cyan', 'google-site-kit' ),
			svg: '',
		},
		{
			colorThemeID: 'green',
			name: __( 'Green', 'google-site-kit' ),
			svg: '',
		},
		{
			colorThemeID: 'purple',
			name: __( 'Purple', 'google-site-kit' ),
			svg: '',
		},
		{
			colorThemeID: 'pink',
			name: __( 'Pink', 'google-site-kit' ),
			svg: '',
		},
		{
			colorThemeID: 'orange',
			name: __( 'Orange', 'google-site-kit' ),
			svg: '',
		},
		{
			colorThemeID: 'brown',
			name: __( 'Brown', 'google-site-kit' ),
			svg: '',
		},
		{
			colorThemeID: 'black',
			name: __( 'Black', 'google-site-kit' ),
			svg: '',
		},
	];
}
