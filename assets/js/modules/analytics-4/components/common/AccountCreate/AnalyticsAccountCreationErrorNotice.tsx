/**
 * AnalyticsAccountCreationErrorNotice component.
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
import type { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import useViewContext from '@/js/hooks/useViewContext';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { trackEvent } from '@/js/util';

export interface AnalyticsAccountCreationErrorNoticeProps {
	errorCode: string;
	onRetry: () => void;
}

const AnalyticsAccountCreationErrorNotice: FC<
	AnalyticsAccountCreationErrorNoticeProps
> = ( { errorCode, onRetry } ) => {
	const viewContext = useViewContext();
	const [ showProgress ] = useQueryArg( 'showProgress' );
	const eventCategory =
		showProgress !== undefined ? `${ viewContext }_setup` : viewContext;

	useEffect( () => {
		trackEvent(
			eventCategory,
			'analytics_account_creation_error',
			errorCode
		);
	}, [ errorCode, eventCategory ] );

	const analyticsAccountLimitHelpURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getGoogleSupportURL( {
				path: '/analytics/',
				hash: 'topic=14090456',
			} ),
		[]
	);

	const additionalAnalyticsSupportURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL(
				'analytics-additional-support'
			),
		[]
	);

	const title = __( 'Analytics account creation failed', 'google-site-kit' );

	let description: ReactNode;
	let ctaButton: {
		label: string;
		onClick?: () => void;
		href?: string;
		external?: boolean;
	};

	if ( errorCode === 'user_cancel' ) {
		description = __(
			'Creating a new Analytics account failed because the Terms of Service were not accepted. Go to Analytics to accept the Terms of Service.',
			'google-site-kit'
		);
		ctaButton = {
			label: __( 'Go to Analytics', 'google-site-kit' ),
			onClick: () => {
				global.history.back();
			},
		};
	} else if ( errorCode === 'max_accounts_reached' ) {
		description = createInterpolateElement(
			__(
				'Creating a new Analytics account failed because the Analytics account limit has been reached. You can manage the number of Analytics accounts associated with your Google account and then try again, or <a>get help</a>',
				'google-site-kit'
			),
			{
				a: <Link href={ analyticsAccountLimitHelpURL } external />,
			}
		);
		ctaButton = {
			label: __( 'Retry', 'google-site-kit' ),
			onClick: onRetry,
		};
	} else {
		description = createInterpolateElement(
			__(
				'Something went wrong. Try again or <a>get help</a>',
				'google-site-kit'
			),
			{
				a: <Link href={ additionalAnalyticsSupportURL } external />,
			}
		);
		ctaButton = {
			label: __( 'Retry', 'google-site-kit' ),
			onClick: onRetry,
		};
	}

	return (
		<Notice
			type={ NOTICE_TYPES.ERROR }
			title={ title }
			description={ description }
			ctaButton={ ctaButton }
		/>
	);
};

export default AnalyticsAccountCreationErrorNotice;
