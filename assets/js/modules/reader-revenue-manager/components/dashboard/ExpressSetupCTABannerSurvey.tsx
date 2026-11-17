/**
 * Reader Revenue Manager Express Setup CTA Banner for the survey CTA.
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
 * External dependencies
 */
import { ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { EDIT_SCOPE } from '@/js/modules/analytics-4/datastore/constants';
import ExpressSetupCTABanner from '@/js/modules/reader-revenue-manager/components/dashboard/ExpressSetupCTABanner';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import svgMobileBanner from '@/svg/graphics/banner-rrm-survey-setup-cta-mobile.svg?url';
import svgDesktopBanner from '@/svg/graphics/banner-rrm-survey-setup-cta.svg?url';

interface ExpressSetupCTABannerSurveyProps {
	id: string;
	Notification: ElementType;
}

export default function ExpressSetupCTABannerSurvey( {
	id,
	Notification,
}: ExpressSetupCTABannerSurveyProps ) {
	// The survey setup records responses in Google Analytics, so
	// request the Analytics edit scope too unless it has already
	// been granted.
	const additionalScopes = useSelect(
		( select: Select ) =>
			select( CORE_USER ).hasScope( EDIT_SCOPE ) ? [] : [ EDIT_SCOPE ],
		[]
	);

	return (
		<Notification>
			<ExpressSetupCTABanner
				additionalScopes={ additionalScopes }
				ctaButtonLabel={ __( 'Set up a survey', 'google-site-kit' ) }
				ctaType={ EXPRESS_SETUP_CTAS.SURVEY }
				description={ __(
					'Add a short survey to your site and get to know who’s reading: their interests, habits, and what brings them back.',
					'google-site-kit'
				) }
				notificationID={ id }
				svg={ {
					desktop: svgDesktopBanner,
					mobile: svgMobileBanner,
				} }
				title={ __(
					'Learn more about your readers',
					'google-site-kit'
				) }
			/>
		</Notification>
	);
}
