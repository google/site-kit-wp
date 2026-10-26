/**
 * Recent activity error notice component.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	isInsufficientPermissionsError,
	isRetryableErrorType,
} from '@/js/util/errors';

export interface RecentActivityErrorNoticeProps {
	/** The slug of the module whose report failed, `analytics-4` by default. */
	moduleSlug?: string;
	/** The error of the section's report. */
	error: unknown;
	/** Requests the section's report again. Without it, the notice shows no "Retry". */
	onRetry?: () => void;
}

const RecentActivityErrorNotice: FC< RecentActivityErrorNoticeProps > = ( {
	moduleSlug = MODULE_SLUG_ANALYTICS_4,
	error,
	onRetry,
} ) => {
	// For a permissions error, "get help" leads to the page about the
	// permissions the module needs, as "Get help" of a report error does.
	const helpURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getErrorTroubleshootingLinkURL(
				isInsufficientPermissionsError( error )
					? { code: `${ moduleSlug }_insufficient_permissions` }
					: error
			),
		[ error, moduleSlug ]
	);

	const description = createInterpolateElement(
		__(
			'We can’t access your traffic data. Try refreshing or <a>get help</a>',
			'google-site-kit'
		),
		{
			a: <Link href={ helpURL } external hideExternalIndicator />,
		}
	);

	// A rate limit error comes back until the quota recovers, and a
	// permissions error until the user's access changes, so neither gets
	// "Retry".
	const isRetryable = isRetryableErrorType( error ) && !! onRetry;

	return (
		<Notice
			type={ NOTICE_TYPES.ERROR }
			title={ __( 'Something went wrong', 'google-site-kit' ) }
			description={ description }
			ctaButton={
				isRetryable
					? {
							label: __( 'Retry', 'google-site-kit' ),
							onClick: onRetry,
					  }
					: undefined
			}
		/>
	);
};

export default RecentActivityErrorNotice;
