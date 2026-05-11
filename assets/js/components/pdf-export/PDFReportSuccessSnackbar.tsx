/**
 * PDF report success snackbar.
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
import type { FC, MouseEvent, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import Link from '@/js/components/Link';
import CloseIcon from '@/svg/icons/close.svg';

export interface PDFReportSuccessSnackbarProps {
	onDismiss?: (
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) => void;
	onAutoDismiss?: () => void;
	autoDismissMS?: number;
	disableAutoDismiss?: boolean;
	title?: string;
	description?: ReactNode;
	dismissAriaLabel?: string;
}

const PDFReportSuccessSnackbar: FC< PDFReportSuccessSnackbarProps > = ( {
	onDismiss = () => {},
	onAutoDismiss = () => {},
	autoDismissMS = 10000,
	disableAutoDismiss = false,
	title = __( 'Your report was generated successfully!', 'google-site-kit' ),
	description,
	dismissAriaLabel = __( 'Dismiss PDF report success', 'google-site-kit' ),
} ) => {
	useEffect( () => {
		if ( disableAutoDismiss ) {
			return () => {};
		}

		const timeoutID = setTimeout( () => {
			onAutoDismiss();
		}, autoDismissMS );

		return () => {
			clearTimeout( timeoutID );
		};
	}, [ autoDismissMS, disableAutoDismiss, onAutoDismiss ] );

	const defaultDescription = createInterpolateElement(
		__(
			'The PDF report has been automatically downloaded to your downloads folder. <a>Click here</a> if the download didn’t start automatically.',
			'google-site-kit'
		),
		{
			a: (
				// @ts-expect-error - The `Link` component is not typed yet.
				<Link href="#" />
			),
		}
	);

	return (
		<Notice
			type={ NOTICE_TYPES.SUCCESS }
			className="googlesitekit-notice-snackbar googlesitekit-notice-snackbar--bottom-right googlesitekit-pdf-report-success-snackbar googlesitekit-notice-snackbar--content--small"
			title={ title }
			description={ description || defaultDescription }
			dismissButton={ {
				variant: 'icon',
				icon: <CloseIcon width={ 10 } height={ 10 } />,
				ariaLabel: dismissAriaLabel,
				onClick: onDismiss,
			} }
		/>
	);
};

export default PDFReportSuccessSnackbar;
