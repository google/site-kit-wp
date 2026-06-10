/**
 * Site Goals breakdown error notice.
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
import { isInsufficientPermissionsError } from '@/js/util/errors';

interface BreakdownErrorNoticeProps {
	error: { message?: string; code?: string; id?: string } & Record<
		string,
		unknown
	>;
	permissionsTitle: string;
	onRetry: () => void;
	onDismiss: () => void;
	className?: string;
}

const BreakdownErrorNotice: FC< BreakdownErrorNoticeProps > = ( {
	error,
	permissionsTitle,
	onRetry,
	onDismiss,
	className,
} ) => {
	const troubleshootingURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getErrorTroubleshootingLinkURL( error ),
		[ error ]
	);

	const isPermissionsError = isInsufficientPermissionsError( error );

	const title = isPermissionsError
		? permissionsTitle
		: __( 'Analytics update failed', 'google-site-kit' );

	const message = isPermissionsError
		? __(
				'We were unable to configure your Google Analytics account settings due to insufficient permissions. To fix this, you can contact your administrator or <a>get help</a>.',
				'google-site-kit'
		  )
		: __(
				'There was a problem updating your Analytics property. <a>Learn more</a>',
				'google-site-kit'
		  );

	return (
		<Notice
			className={ className }
			type={ NOTICE_TYPES.ERROR }
			title={ title }
			description={ createInterpolateElement( message, {
				a: <Link href={ troubleshootingURL } external />,
			} ) }
			ctaButton={ {
				label: __( 'Retry', 'google-site-kit' ),
				onClick: onRetry,
			} }
			dismissButton={ {
				label: __( 'Got it', 'google-site-kit' ),
				onClick: onDismiss,
			} }
		/>
	);
};

export default BreakdownErrorNotice;
