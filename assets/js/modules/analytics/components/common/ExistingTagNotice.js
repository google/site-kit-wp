/**
 * Analytics Existing Tag Notice component.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
const { useSelect } = Data;

export default function ExistingTagNotice() {
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);

	const hasGA4ExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasExistingTag()
	);

	const ga4ExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getExistingTag()
	);

	const measurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);

	const gtmAnalyticsPropertyID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID()
	);

	const hasGTMAnalyticsProperty = !! gtmAnalyticsPropertyID;

	if ( ! hasGTMAnalyticsProperty ) {
		return null;
	}

	function getNoticeForExistingGTMPropertyAndGA4Tag() {
		if (
			gtmAnalyticsPropertyID === propertyID &&
			ga4ExistingTag === measurementID
		) {
			return sprintf(
				/* translators: %1$s: GTM property ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Google Tag Manager property with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since they refer to the same properties selected here, Site Kit will not place its own tags and rely on the existing ones. If later on you decide to remove this property and/or tag, Site Kit can place new tags for you.',
					'google-site-kit'
				),
				gtmAnalyticsPropertyID,
				ga4ExistingTag
			);
		} else if (
			gtmAnalyticsPropertyID === propertyID &&
			ga4ExistingTag !== measurementID
		) {
			return sprintf(
				/* translators: %1$s: GTM property ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Google Tag Manager property with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since the Google Tag Manager property refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one.',
					'google-site-kit'
				),
				gtmAnalyticsPropertyID,
				ga4ExistingTag
			);
		} else if (
			gtmAnalyticsPropertyID !== propertyID &&
			ga4ExistingTag === measurementID
		) {
			return sprintf(
				/* translators: %1$s: GTM property ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Google Tag Manager property with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since the Google Analytics 4 tag refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this tag, Site Kit can place a new tag for you.',
					'google-site-kit'
				),
				gtmAnalyticsPropertyID,
				ga4ExistingTag
			);
		}
		return sprintf(
			/* translators: %1$s: GTM property ID, %2$s: Analytics 4 measurement ID */
			__(
				'An existing Google Tag Manager property with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site.',
				'google-site-kit'
			),
			gtmAnalyticsPropertyID,
			ga4ExistingTag
		);
	}

	function getNoticeForExistingGTMProperty() {
		if ( gtmAnalyticsPropertyID === propertyID ) {
			return sprintf(
				/* translators: %s: GTM property ID */
				__(
					'An existing Google Tag Manager property was found on your site with the ID %s. Since it refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this property, Site Kit can place a new tag for you.',
					'google-site-kit'
				),
				gtmAnalyticsPropertyID
			);
		}
		return sprintf(
			/* translators: %s: GTM property ID */
			__(
				'An existing Google Tag Manager property was found on your site with the ID %s.',
				'google-site-kit'
			),
			gtmAnalyticsPropertyID
		);
	}

	const notice = hasGA4ExistingTag
		? getNoticeForExistingGTMPropertyAndGA4Tag()
		: getNoticeForExistingGTMProperty();

	return <p>{ notice }</p>;
}
