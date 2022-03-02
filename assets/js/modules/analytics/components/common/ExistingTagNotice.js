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
	let notice;

	const ua = useSelect( ( select ) => ( {
		hasExistingTag: select( MODULES_ANALYTICS ).hasExistingTag(),
		existingTag: select( MODULES_ANALYTICS ).getExistingTag(),
		propertyID: select( MODULES_ANALYTICS ).getPropertyID(),
	} ) );

	const ga4 = useSelect( ( select ) => {
		return {
			hasExistingTag: select( MODULES_ANALYTICS_4 ).hasExistingTag(),
			existingTag: select( MODULES_ANALYTICS_4 ).getExistingTag(),
			measurementID: select( MODULES_ANALYTICS_4 ).getMeasurementID(),
		};
	} );

	const gtmAnalyticsPropertyID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID()
	);

	const hasGTMAnalyticsProperty = !! gtmAnalyticsPropertyID;

	function getNoticeForExistingUAAndGA4Tags() {
		if (
			ua.existingTag === ua.propertyID &&
			ga4.existingTag === ga4.measurementID
		) {
			return sprintf(
				/* translators: %1$s: Analytics tag ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Universal Analytics tag with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since these tags refer to the same properties selected here, Site Kit will not place its own tags and rely on the existing ones. If later on you decide to remove these tags, Site Kit can place new tags for you.',
					'google-site-kit'
				),
				ua.existingTag,
				ga4.existingTag
			);
		} else if (
			ua.existingTag === ua.propertyID &&
			ga4.existingTag !== ga4.measurementID
		) {
			return sprintf(
				/* translators: %1$s: Analytics tag ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Universal Analytics tag with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since the Universal Analytics tag refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one.',
					'google-site-kit'
				),
				ua.existingTag,
				ga4.existingTag
			);
		} else if (
			ua.existingTag !== ua.propertyID &&
			ga4.existingTag === ga4.measurementID
		) {
			return sprintf(
				/* translators: %1$s: Analytics tag ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Universal Analytics tag with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since the Google Analytics 4 tag refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this tag, Site Kit can place a new tag for you.',
					'google-site-kit'
				),
				ua.existingTag,
				ga4.existingTag
			);
		}
		return sprintf(
			/* translators: %1$s: Analytics tag ID, %2$s: Analytics 4 measurement ID */
			__(
				'An existing Universal Analytics tag with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site.',
				'google-site-kit'
			),
			ua.existingTag,
			ga4.existingTag
		);
	}

	function getNoticeForExistingUATag() {
		if ( ua.existingTag === ua.propertyID ) {
			return sprintf(
				/* translators: %s: Analytics tag ID */
				__(
					'An existing Universal Analytics tag was found on your site with the ID %s. Since this tag refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this tag, Site Kit can place a new tag for you.',
					'google-site-kit'
				),
				ua.existingTag
			);
		}
		return sprintf(
			/* translators: %s: Analytics tag ID */
			__(
				'An existing Universal Analytics tag was found on your site with the ID %s.',
				'google-site-kit'
			),
			ua.existingTag
		);
	}

	function getNoticeForExistingGA4Tag() {
		if ( ga4.existingTag === ga4.measurementID ) {
			return sprintf(
				/* translators: %s: Analytics 4 measurement ID */
				__(
					'An existing Google Analytics 4 tag was found on your site with the ID %s. Since this tag refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this tag, Site Kit can place a new tag for you.',
					'google-site-kit'
				),
				ga4.existingTag
			);
		}
		return sprintf(
			/* translators: %s: Analytics 4 measurement ID */
			__(
				'An existing Google Analytics 4 tag was found on your site with the ID %s.',
				'google-site-kit'
			),
			ga4.existingTag
		);
	}

	function getNoticeForExistingGTMPropertyAndGA4Tag() {
		if (
			gtmAnalyticsPropertyID === ua.propertyID &&
			ga4.existingTag === ga4.measurementID
		) {
			return sprintf(
				/* translators: %1$s: GTM property ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Google Tag Manager property with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since they refer to the same properties selected here, Site Kit will not place its own tags and rely on the existing ones. If later on you decide to remove this property and/or tag, Site Kit can place new tags for you.',
					'google-site-kit'
				),
				gtmAnalyticsPropertyID,
				ga4.existingTag
			);
		} else if (
			gtmAnalyticsPropertyID === ua.propertyID &&
			ga4.existingTag !== ga4.measurementID
		) {
			return sprintf(
				/* translators: %1$s: GTM property ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Google Tag Manager property with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since the Google Tag Manager property refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one.',
					'google-site-kit'
				),
				gtmAnalyticsPropertyID,
				ga4.existingTag
			);
		} else if (
			gtmAnalyticsPropertyID !== ua.propertyID &&
			ga4.existingTag === ga4.measurementID
		) {
			return sprintf(
				/* translators: %1$s: GTM property ID, %2$s: Analytics 4 measurement ID */
				__(
					'An existing Google Tag Manager property with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site. Since the Google Analytics 4 tag refers to the same property selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this tag, Site Kit can place a new tag for you.',
					'google-site-kit'
				),
				gtmAnalyticsPropertyID,
				ga4.existingTag
			);
		}
		return sprintf(
			/* translators: %1$s: GTM property ID, %2$s: Analytics 4 measurement ID */
			__(
				'An existing Google Tag Manager property with the ID %1$s and an existing Google Analytics 4 tag with the ID %2$s were found on your site.',
				'google-site-kit'
			),
			gtmAnalyticsPropertyID,
			ga4.existingTag
		);
	}

	function getNoticeForExistingGTMProperty() {
		if ( gtmAnalyticsPropertyID === ua.propertyID ) {
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

	if ( ua.hasExistingTag ) {
		if ( ga4.hasExistingTag ) {
			notice = getNoticeForExistingUAAndGA4Tags();
		} else {
			notice = getNoticeForExistingUATag();
		}
	} else if ( hasGTMAnalyticsProperty ) {
		if ( ga4.hasExistingTag ) {
			notice = getNoticeForExistingGTMPropertyAndGA4Tag();
		} else {
			notice = getNoticeForExistingGTMProperty();
		}
	} else if ( ga4.hasExistingTag ) {
		notice = getNoticeForExistingGA4Tag();
	}

	if ( ! notice ) {
		return null;
	}

	return <p>{ notice }</p>;
}
