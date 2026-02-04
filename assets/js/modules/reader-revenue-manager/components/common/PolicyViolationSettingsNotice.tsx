/**
 * Reader Revenue Manager PolicyViolationSettingsNotice component.
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
import type { FC } from 'react';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import {
	MODULES_READER_REVENUE_MANAGER,
	CONTENT_POLICY_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { getPolicyViolationNotificationCopy } from '@/js/modules/reader-revenue-manager/components/dashboard/PolicyViolationNotification/get-policy-violation-notification-copy';
import Notice from '@/js/components/Notice';

const { CONTENT_POLICY_STATE_OK } = CONTENT_POLICY_STATES;

const PolicyViolationSettingsNotice: FC = () => {
	const contentPolicyState = useSelect( ( select: Select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getContentPolicyState()
	);

	const policyInfoURL = useSelect( ( select: Select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPolicyInfoURL()
	);

	if (
		contentPolicyState === undefined ||
		contentPolicyState === CONTENT_POLICY_STATE_OK
	) {
		return null;
	}

	const { title, description, ctaLabel, type } =
		getPolicyViolationNotificationCopy( contentPolicyState );

	return (
		<Notice
			// @ts-expect-error - The `Notice` component is not typed yet.
			className="googlesitekit-policy-violation-settings-notice"
			type={ type }
			title={ title }
			description={ description }
			ctaButton={ {
				label: ctaLabel,
				href: policyInfoURL,
				external: true,
			} }
		/>
	);
};

export default PolicyViolationSettingsNotice;
