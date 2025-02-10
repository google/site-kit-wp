/**
 * Reader Revenue Manager constants.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

export const SNIPPET_MODES = {
	post_types: __( 'Specific content types', 'google-site-kit' ),
	per_post: __( 'Specified pages', 'google-site-kit' ),
	sitewide: __( 'Site wide', 'google-site-kit' ),
};

export const RRM_SETUP_NOTIFICATION_ID = 'rrm-setup-notification';
export const RRM_SETUP_SUCCESS_NOTIFICATION_ID =
	'setup-success-notification-rrm';
export const RRM_PRODUCT_ID_NOTIFICATION_ID = 'rrm-product-id-notification';
