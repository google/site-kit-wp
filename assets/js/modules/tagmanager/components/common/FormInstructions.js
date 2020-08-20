/**
 * Tag Manager Form Instructions component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import ExistingTagNotice from './ExistingTagNotice';
import ErrorText from '../../../../components/error-text';
const { useSelect } = Data;

export default function FormInstructions() {
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const isSecondaryAMP = useSelect( ( select ) => select( CORE_SITE ).isSecondaryAMP() );
	const gtmAnalyticsPropertyID = useSelect( ( select ) => select( STORE_NAME ).getSingleAnalyticsPropertyID() );
	const hasMultipleAnalyticsPropertyIDs = useSelect( ( select ) => select( STORE_NAME ).hasMultipleAnalyticsPropertyIDs() );
	const analyticsPropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS ).getPropertyID() );

	if ( hasMultipleAnalyticsPropertyIDs ) {
		/* translators: %1$s: GTM Analytics property ID, %2$s: Analytics property ID */
		const message = __( 'Looks like you’re already using Google Analytics within your Google Tag Manager configuration. However, its Analytics property %1$s is different from the Analytics property %2$s, which is currently selected in the plugin. You need to configure the same Analytics property in both places.', 'google-site-kit' );

		return <ErrorText message={ sprintf( message, gtmAnalyticsPropertyID, analyticsPropertyID ) } />;
	}

	if ( hasExistingTag ) {
		return <ExistingTagNotice />;
	}

	if ( gtmAnalyticsPropertyID && gtmAnalyticsPropertyID === analyticsPropertyID ) {
		/* translators: %s: Analytics property ID */
		const message = __( 'Looks like you’re using Google Analytics. Your Analytics property %s is already set up in your Google Tag Manager configuration, so Site Kit will switch to using Google Tag Manager for Analytics.', 'google-site-kit' );
		return (
			<p>
				{ sprintf( message, gtmAnalyticsPropertyID ) }
			</p>
		);
	}

	if ( isSecondaryAMP ) {
		return (
			<p>
				{ __( 'Looks like your site is using paired AMP. Please select your Tag Manager account and relevant containers below, the snippets will be inserted automatically on your site.', 'google-site-kit' ) }
			</p>
		);
	}

	return (
		<p>
			{ __( 'Please select your Tag Manager account and container below, the snippet will be inserted automatically on your site.', 'google-site-kit' ) }
		</p>
	);
}
