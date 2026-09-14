/**
 * Reader Revenue Manager Newsletter CTA preview component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useFormValue from '@/js/hooks/useFormValue';
import { NEWSLETTER_SIGNUP_FORM } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/constants';
import CTAPreview, {
	CTA_PREVIEW_TAB_INLINE,
	CTA_PREVIEW_TAB_POPUP,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/CTAPreview';
import { EXPRESS_SETUP_CTA_FORMS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import InlinePane from './InlinePane';
import PopupPane from './PopupPane';

export default function Preview() {
	const [ activeTab, setActiveTab ] = useState( CTA_PREVIEW_TAB_POPUP );

	const [ ctaTitle ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CTA_TITLE
	);
	const [ ctaBody ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CTA_BODY
	);
	const [ consentEnabled ] = useFormValue< boolean >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CONSENT_ENABLED
	);
	const [ consentText ] = useFormValue< string >(
		EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP,
		NEWSLETTER_SIGNUP_FORM.CONSENT_TEXT
	);

	const paneProps = {
		ctaTitle,
		ctaBody,
		consentEnabled: !! consentEnabled,
		consentText,
	};

	const title =
		activeTab === CTA_PREVIEW_TAB_INLINE
			? __( 'How this would look?', 'google-site-kit' )
			: __( 'See how it looks', 'google-site-kit' );

	return (
		<CTAPreview
			className="googlesitekit-rrm-newsletter-preview-shell"
			title={ title }
			onTabChange={ setActiveTab }
			popupContent={ <PopupPane { ...paneProps } /> }
			inlineContent={ <InlinePane { ...paneProps } /> }
		/>
	);
}
