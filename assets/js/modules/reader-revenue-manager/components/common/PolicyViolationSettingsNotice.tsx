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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { useInView } from '@/js/hooks/useInView';
import { getPolicyViolationNotificationCopy } from '@/js/modules/reader-revenue-manager/components/dashboard/PolicyViolationNotification/get-policy-violation-notification-copy';
import { RRM_POLICY_VIOLATION_NOTIFICATION_ID } from '@/js/modules/reader-revenue-manager/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	POLICY_VIOLATION_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

const PolicyViolationSettingsNotice: FC = () => {
	const contentPolicyState = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getContentPolicyState(),
		[]
	);

	const policyInfoURL = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPolicyInfoURL(),
		[]
	);

	const inView = useInView();
	const trackEvents = useNotificationEvents(
		RRM_POLICY_VIOLATION_NOTIFICATION_ID
	);

	const [ isViewedOnce, setIsViewedOnce ] = useState( false );

	// Track view event when notice comes into view.
	useEffect( () => {
		if ( ! isViewedOnce && inView ) {
			trackEvents.view( contentPolicyState );

			setIsViewedOnce( true );
		}
	}, [ inView, trackEvents, isViewedOnce, contentPolicyState ] );

	const handleCTAClick = useCallback( () => {
		trackEvents.confirm( contentPolicyState );
	}, [ contentPolicyState, trackEvents ] );

	if ( ! POLICY_VIOLATION_STATES.includes( contentPolicyState ) ) {
		return null;
	}

	const { title, description, ctaLabel, type } =
		getPolicyViolationNotificationCopy( contentPolicyState );

	return (
		<Notice
			className="googlesitekit-policy-violation-settings-notice"
			type={ type }
			title={ title }
			description={ description }
			ctaButton={ {
				label: ctaLabel,
				href: policyInfoURL,
				external: true,
				onClick: handleCTAClick,
			} }
		/>
	);
};

export default PolicyViolationSettingsNotice;
