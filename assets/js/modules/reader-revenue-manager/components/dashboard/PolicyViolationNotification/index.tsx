/**
 * PolicyViolationNotification component.
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
import { FC, ElementType } from 'react';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { HOUR_IN_SECONDS } from '@/js/util/dates';
import {
	MODULES_READER_REVENUE_MANAGER,
	CONTENT_POLICY_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { getPolicyViolationNotificationCopy } from './get-policy-violation-notification-copy';

interface PolicyViolationNotificationProps {
	id: string;
	Notification: ElementType;
}

const { CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE } =
	CONTENT_POLICY_STATES;

const PolicyViolationNotification: FC< PolicyViolationNotificationProps > = ( {
	id,
	Notification,
} ) => {
	const contentPolicyState = useSelect( ( select: Select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getContentPolicyState()
	);

	const policyInfoURL = useSelect( ( select: Select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPolicyInfoURL()
	);

	const { title, description, ctaLabel, type } =
		getPolicyViolationNotificationCopy( contentPolicyState );

	const dismissOptions =
		contentPolicyState === CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE
			? {}
			: {
					skipExpiryCheck: true,
					expiresInSeconds: HOUR_IN_SECONDS,
			  };

	return (
		<Notification>
			{ /* @ts-expect-error - The `NoticeNotification` component is not typed yet. */ }
			<NoticeNotification
				type={ type }
				notificationID={ id }
				title={ title }
				description={ description }
				dismissButton={ {
					dismissOptions,
				} }
				ctaButton={ {
					label: ctaLabel,
					href: policyInfoURL,
					external: true,
					dismissOnClick: true,
					dismissOptions,
				} }
			/>
		</Notification>
	);
};

export default PolicyViolationNotification;
