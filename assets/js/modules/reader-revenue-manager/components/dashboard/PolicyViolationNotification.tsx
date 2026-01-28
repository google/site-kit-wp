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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { FC, ElementType } from 'react';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '@/js/components/Notice/constants';
import { HOUR_IN_SECONDS } from '@/js/util/dates';
import {
	MODULES_READER_REVENUE_MANAGER,
	CONTENT_POLICY_STATES,
	PENDING_POLICY_VIOLATION_STATES,
	ACTIVE_POLICY_VIOLATION_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

interface PolicyViolationNotificationProps {
	id: string;
	Notification: ElementType;
}

const { CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE } =
	CONTENT_POLICY_STATES;

/**
 * Returns the notification copy based on the content policy state.
 *
 * @since n.e.x.t
 *
 * @param {string} contentPolicyState The content policy state.
 * @return {Object} An object with title, description, ctaLabel, and type.
 */
function getNotificationCopy( contentPolicyState: string ) {
	// Extreme severity - terminated account.
	if (
		contentPolicyState === CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE
	) {
		return {
			title: __(
				'Action needed: Your Reader Revenue Manager account is terminated',
				'google-site-kit'
			),
			description: __(
				"Your account is terminated because your site content doesn't follow the rules. Visit Publisher Center for more information.",
				'google-site-kit'
			),
			ctaLabel: __( 'Learn more', 'google-site-kit' ),
			type: TYPES.ERROR,
		};
	}

	// Active moderate/high severity - restricted account.
	if ( ACTIVE_POLICY_VIOLATION_STATES.includes( contentPolicyState ) ) {
		return {
			title: __(
				'Action needed: Your Reader Revenue Manager account is restricted',
				'google-site-kit'
			),
			description: __(
				"Your site has content that doesn't follow the rules. To see more details and resolve the violation, please visit Publisher Center.",
				'google-site-kit'
			),
			ctaLabel: __( 'View violations', 'google-site-kit' ),
			type: TYPES.WARNING,
		};
	}

	// Pending moderate/high severity - grace period.
	if ( PENDING_POLICY_VIOLATION_STATES.includes( contentPolicyState ) ) {
		return {
			title: __(
				'Action needed: fix a policy issue with Reader Revenue Manager',
				'google-site-kit'
			),
			description: __(
				'Your site has content that breaks the rules for Reader Revenue Manager. To keep your account active and CTAs public, you must resolve all policy violations.',
				'google-site-kit'
			),
			ctaLabel: __( 'View violations', 'google-site-kit' ),
			type: TYPES.WARNING,
		};
	}

	// Default fallback (should not be reached for valid violation states).
	return {
		title: '',
		description: '',
		ctaLabel: '',
		type: TYPES.WARNING,
	};
}

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

	if ( ! contentPolicyState ) {
		return null;
	}

	const { title, description, ctaLabel, type } =
		getNotificationCopy( contentPolicyState );

	if ( ! title ) {
		return null;
	}

	const isExtremeSeverity =
		contentPolicyState === CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE;

	return (
		<Notification>
			{ /* @ts-expect-error - The `NoticeNotification` component is not typed yet. */ }
			<NoticeNotification
				type={ type }
				notificationID={ id }
				title={ title }
				description={ description }
				dismissButton={ {
					dismissOptions: isExtremeSeverity
						? {}
						: {
								skipExpiryCheck: true,
								expiresInSeconds: HOUR_IN_SECONDS,
						  },
				} }
				ctaButton={ {
					label: ctaLabel,
					href: policyInfoURL,
					external: true,
					dismissOnClick: true,
					dismissOptions: isExtremeSeverity
						? {}
						: {
								skipExpiryCheck: true,
								expiresInSeconds: HOUR_IN_SECONDS,
						  },
				} }
			/>
		</Notification>
	);
};

export default PolicyViolationNotification;
