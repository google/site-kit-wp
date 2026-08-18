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
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import {
	NOTICE_TYPES,
	NOTICE_VARIANTS,
} from '@/js/components/Notice/constants';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';
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
	const breakpoint = useBreakpoint();

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
			'The PDF report has been automatically downloaded to your downloads folder. If the download doesn’t start automatically, you can manually <a>download your report</a>.',
			'google-site-kit'
		),
		{
			a: (
				// TODO: Replace the `href` value with the actual Blob URL to
				// download the report when available.
				// This `href="#" is just a placeholder.
				<Link href="#" />
			),
		}
	);

	return (
		<Notice
			className="googlesitekit-pdf-report-success-snackbar"
			description={ description || defaultDescription }
			dismissButton={ {
				variant: 'icon',
				icon: <CloseIcon width={ 10 } height={ 10 } />,
				ariaLabel: dismissAriaLabel,
				onClick: onDismiss,
			} }
			title={ breakpoint === BREAKPOINT_SMALL ? undefined : title }
			type={ NOTICE_TYPES.SUCCESS }
			variant={ NOTICE_VARIANTS.SNACKBAR }
		/>
	);
};

export default PDFReportSuccessSnackbar;
