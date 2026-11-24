/**
 * Traffic Overview notice that offers a reset when the Site Kit service has
 * no record of the site.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import ResetButton from '@/js/components/ResetButton';
import {
	CORE_USER,
	PERMISSION_SETUP,
} from '@/js/googlesitekit/datastore/user/constants';

export interface TrafficInsightResetNoticeProps {
	/** Whether the Site Kit service answered the request for the insight with `SITE_NOT_FOUND`: it has no record of the site. Without it, the notice has nothing to say. */
	siteNotFound?: boolean;
}

/**
 * Shows, in place of the generated insights, that the Site Kit service has no
 * record of the site, such as after the site was deleted from it, and offers
 * a reset of Site Kit, which the service asks for: the site's setup needs
 * that record too, so only a reset and a new setup fix it.
 *
 * A reset disconnects every user, so only a user who can set up Site Kit sees
 * the notice. Any other user sees the panel without the insights.
 *
 * @since n.e.x.t
 *
 * @param {Object}  props              The component's props.
 * @param {boolean} props.siteNotFound Whether the service has no record of the site.
 * @return {(Object|null)} The notice, or null when the service knows the site or the user can't set up Site Kit.
 */
const TrafficInsightResetNotice: FC< TrafficInsightResetNoticeProps > = ( {
	siteNotFound = false,
} ) => {
	// The capabilities are read only for the notice, so a panel whose
	// insight is fine never requests them.
	const canSetup = useSelect(
		( select: Select ) =>
			siteNotFound
				? select( CORE_USER ).hasCapability( PERMISSION_SETUP )
				: false,
		[ siteNotFound ]
	);

	if ( ! siteNotFound || ! canSetup ) {
		return null;
	}

	return (
		<Notice
			type={ NOTICE_TYPES.WARNING }
			className="googlesitekit-traffic-overview__insight-reset-notice"
			title={ __(
				'Site Kit can’t generate insights',
				'google-site-kit'
			) }
			description={ __(
				'The Site Kit service no longer recognizes this site. Reset Site Kit to connect it again.',
				'google-site-kit'
			) }
			actionContent={
				// The button asks the user to confirm the reset.
				<ResetButton>
					{ __( 'Reset Site Kit', 'google-site-kit' ) }
				</ResetButton>
			}
		/>
	);
};

export default TrafficInsightResetNotice;
