/**
 * `modules/analytics` data store: notification.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../../modules/analytics/datastore/constants';
const { createRegistrySelector } = Data;

export const selectors = {
	/**
	 * Gets the content for the setup success notification.
	 *
	 * @since 1.45.0
	 *
	 * @return {Object} The service description, learn more label and URL.
	 */
	getSetupSuccessContent: createRegistrySelector( ( select ) => () => {
		const isGA4DashboardView =
			select( MODULES_ANALYTICS ).isGA4DashboardView();

		if ( isGA4DashboardView ) {
			return null;
		}

		const documentationURL =
			select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );

		return {
			description: __(
				'You’ll only see Universal Analytics data for now.',
				'google-site-kit'
			),
			learnMore: {
				label: __( 'Learn more', 'google-site-kit' ),
				url: documentationURL,
			},
		};
	} ),
};

const store = {
	selectors,
};

export default store;
