/**
 * Thank with Google utility functions.
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
 * Gets the type value based on the buttonPlacement setting.
 *
 * @since n.e.x.t
 *
 * @param {string} buttonPlacement The buttonPlacement setting value.
 * @return {string} "Fixed" or "Overlay" depending on if buttonPlacement is static or dynamic.
 */
export const getType = ( buttonPlacement ) => {
	if ( 'static' === buttonPlacement.substring( 0, 5 ) ) {
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
		case 'static_auto':
			return __( 'Auto', 'google-site-kit' );
		case 'static_above-content':
			return __( 'Above the post', 'google-site-kit' );
		case 'static_below-content':
			return __( 'Below the post', 'google-site-kit' );
		case 'static_below-first-paragraph':
			return __( 'Below the 1st paragraph', 'google-site-kit' );
		case 'dynamic_high':
			return __( 'High', 'google-site-kit' );
		case 'dynamic_low':
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
 * @return {string} Formatted string of buttonPostTypes.
 */
export const getButtonPostTypes = ( buttonPostTypes ) => {
	return buttonPostTypes.join( ', ' );
};
