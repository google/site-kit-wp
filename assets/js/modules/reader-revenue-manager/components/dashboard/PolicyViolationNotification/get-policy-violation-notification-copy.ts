/**
 * Get notification copy utility.
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
 * Internal dependencies
 */
import { TYPES } from '@/js/components/Notice/constants';
import {
	CONTENT_POLICY_STATES,
	ACTIVE_POLICY_VIOLATION_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

const { CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE } =
	CONTENT_POLICY_STATES;

export interface NotificationCopy {
	title: string;
	description: string;
	ctaLabel: string;
	type: string;
}

/**
 * Returns the notification copy based on the content policy state.
 *
 * @since n.e.x.t
 *
 * @param {string} contentPolicyState The content policy state.
 * @return {Object} An object with title, description, ctaLabel, and type.
 */
export function getPolicyViolationNotificationCopy(
	contentPolicyState: string
): NotificationCopy {
	// Extreme severity - terminated account.
	if (
		contentPolicyState ===
		CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
	) {
		return {
			title: __(
				'Action needed: Your Reader Revenue Manager account is terminated',
				'google-site-kit'
			),
			description: __(
				'Your account is terminated because your site content doesn’t follow the rules. Visit Publisher Center for more information.',
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
				'Your site has content that doesn’t follow the rules. To see more details and resolve the violation, please visit Publisher Center.',
				'google-site-kit'
			),
			ctaLabel: __( 'View violations', 'google-site-kit' ),
			type: TYPES.WARNING,
		};
	}

	// Pending moderate/high severity - grace period (default for valid violation states).
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
