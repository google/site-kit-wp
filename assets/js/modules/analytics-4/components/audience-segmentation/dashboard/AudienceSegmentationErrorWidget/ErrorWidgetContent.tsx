/**
 * ErrorWidgetContent component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import GetHelpLink from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/GetHelpLink';
import { isInsufficientPermissionsError } from '@/js/util/errors';
import { listFormat } from '@/js/util/i18n';

interface ErrorWidgetContentProps {
	errors: object[];
	failedAudiences?: string[];
	onRequestAccess: () => void;
	onRetry: () => void;
	showRetryButton?: boolean;
	Widget: ElementType;
}

const ErrorWidgetContent = forwardRef(
	(
		{
			errors,
			failedAudiences,
			onRequestAccess,
			onRetry,
			showRetryButton,
			Widget,
		}: ErrorWidgetContentProps,
		ref
	) => {
		const hasInsufficientPermissionsError = errors.some(
			isInsufficientPermissionsError
		);

		const requestAccessURL = undefined; // TODO: Get service access URL.

		const handleRetry = useCallback( () => {
			// TODO: Retry retryable `errors`.
			onRetry?.();
		}, [ onRetry ] );

		const ctaButton = showRetryButton
			? {
					label: __( 'Retry', 'google-site-kit' ),
					onClick: handleRetry,
			  }
			: {
					href: requestAccessURL,
					label: __( 'Request access', 'google-site-kit' ),
					onClick: onRequestAccess,
			  };

		let description;
		let title = 'Your visitor groups data loading failed';

		if ( failedAudiences?.length ) {
			description = sprintf(
				// translators: %s: comma-separated list of failed audiences.
				__(
					'Failed to load data for the following audiences: %s',
					'google-site-kit'
				),
				listFormat( failedAudiences, { style: 'narrow' } )
			);
		}

		const helpLinkURL = undefined; // TODO: Get help link for `errors`.

		if ( hasInsufficientPermissionsError ) {
			description = GetHelpLink( { linkURL: helpLinkURL } );
			title = __( 'Insufficient permissions', 'google-site-kit' );
		}

		return (
			<Widget ref={ ref } noPadding>
				<Notice
					ctaButton={ ctaButton }
					description={ description }
					title={ title }
					type={ NOTICE_TYPES.ERROR }
				/>
			</Widget>
		);
	}
);

export default ErrorWidgetContent;
