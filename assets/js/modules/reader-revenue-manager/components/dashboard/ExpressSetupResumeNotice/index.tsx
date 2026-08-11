/**
 * ExpressSetupResumeNotice component.
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
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import NoticeNotification, {
	type NoticeNotificationProps,
} from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';

export interface ExpressSetupResumeNoticeProps
	extends Omit<
		NoticeNotificationProps,
		'ctaButton' | 'dismissButton' | 'type'
	> {
	setupCTA: string;
}

export default function ExpressSetupResumeNotice( {
	setupCTA,
	...props
}: ExpressSetupResumeNoticeProps ) {
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const setupURL = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getAdminReauthURL( {
				redirectQueryArgs: {
					cta: setupCTA,
					expressSetup: true,
					reAuth: true,
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				},
			} ),
		[ setupCTA ]
	);

	const onCTAClick = useCallback( () => {
		if ( setupURL ) {
			navigateTo( setupURL );
		}
	}, [ navigateTo, setupURL ] );

	if ( ! setupURL ) {
		return null;
	}

	return (
		<NoticeNotification
			ctaButton={ {
				label: __( 'Show me', 'google-site-kit' ),
				onClick: onCTAClick,
			} }
			dismissButton={ {
				label: __( 'Got it', 'google-site-kit' ),
			} }
			type={ NOTICE_TYPES.NEW }
			{ ...props }
		/>
	);
}
