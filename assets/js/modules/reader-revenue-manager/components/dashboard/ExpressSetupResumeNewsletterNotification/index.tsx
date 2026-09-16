/**
 * ExpressSetupResumeNewsletterNotification component.
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
import ExpressSetupResumeNotice from '@/js/modules/reader-revenue-manager/components/dashboard/ExpressSetupResumeNotice';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';

interface ExpressSetupResumeNewsletterNotificationProps {
	id: string;
	Notification: ElementType;
}

export default function ExpressSetupResumeNewsletterNotification( {
	id,
	Notification,
}: ExpressSetupResumeNewsletterNotificationProps ) {
	return (
		<Notification>
			<ExpressSetupResumeNotice
				description={ __(
					"It looks like you haven't finished setting up your newsletter sign-up form. Resume the setup to complete it and publish it to your site.",
					'google-site-kit'
				) }
				notificationID={ id }
				setupCTA={ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }
				title={ __(
					'You’re just a few steps away from collecting reader emails!',
					'google-site-kit'
				) }
			/>
		</Notification>
	);
}
