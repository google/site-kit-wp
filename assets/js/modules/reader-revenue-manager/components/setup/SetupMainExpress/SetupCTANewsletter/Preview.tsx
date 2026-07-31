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
 * Internal dependencies
 */
import CTAPreview from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/CTAPreview';
import InlinePane from './InlinePane';
import PopupPane from './PopupPane';

interface Props {
	ctaTitle?: string;
	ctaBody?: string;
	consentEnabled?: boolean;
	consentText?: string;
}

export default function Preview( {
	ctaTitle,
	ctaBody,
	consentEnabled,
	consentText,
}: Props ) {
	const paneProps = { ctaTitle, ctaBody, consentEnabled, consentText };

	return (
		<CTAPreview
			popupContent={ <PopupPane { ...paneProps } /> }
			inlineContent={ <InlinePane { ...paneProps } /> }
			classNames="googlesitekit-rrm-newsletter-preview"
		/>
	);
}
