/**
 * PolicyViolation component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { FC, ElementType } from 'react';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect, type Select } from '@/js/googlesitekit-data';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import {
	CONTENT_POLICY_STATES,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { DAY_IN_SECONDS } from '@/js/util';
import {
	RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID,
} from '@/js/modules/reader-revenue-manager/constants';
import { TYPES } from '@/js/components/Notice/constants';

interface PolicyViolationProps {
	id: string;
	Notification: ElementType;
	gaTrackingEventArgs: Record< string, string >;
	dismissNotice: () => void;
	onCTAClick: () => void;
	policyViolationType: 'PENDING_POLICY_VIOLATION' | 'ACTIVE_POLICY_VIOLATION';
}

const PolicyViolation: FC< PolicyViolationProps > = ( {
	id,
	Notification,
	gaTrackingEventArgs,
	dismissNotice,
	onCTAClick,
	policyViolationType,
} ) => {
	const contentPolicyState = useSelect( ( select: Select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getContentPolicyState()
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const onDismiss = useCallback( () => {
		dismissNotice();

		// Proactively dismiss the policy violation notification for the next 24 hours.
		dismissItem(
			contentPolicyState ===
				CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
				? RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID
				: RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID,
			{
				expiresInSeconds: DAY_IN_SECONDS,
			}
		);
	}, [ contentPolicyState, dismissItem, dismissNotice ] );

	const description =
		policyViolationType === 'PENDING_POLICY_VIOLATION'
			? __(
					'Your account is linked, but your site has content that doesn’t follow the rules for Reader Revenue Manager. To keep your Reader Revenue Manager account active and CTAs public, you must resolve all policy violations.',
					'google-site-kit'
			  )
			: __(
					'Your account is connected but currently restricted because your site has content that doesn’t follow the rules for Reader Revenue Manager. To keep your Reader Revenue Manager account active and CTAs public, you must resolve all policy violations.',
					'google-site-kit'
			  );

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			{ /* @ts-expect-error - The `NoticeNotification` component is not typed yet. */ }
			<NoticeNotification
				type={ TYPES.WARNING }
				notificationID={ id }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				title={ __(
					'Reader Revenue Manager is connected, but action is required',
					'google-site-kit'
				) }
				description={ description }
				dismissButton={ {
					onClick: onDismiss,
				} }
				ctaButton={ {
					label: __( 'View violations', 'google-site-kit' ),
					onClick: onCTAClick,
					external: true,
				} }
			/>
		</Notification>
	);
};

export default PolicyViolation;
