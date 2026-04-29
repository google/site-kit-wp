/**
 * PDF report error snackbar.
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
import type { MouseEvent, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import Notice from '@/js/components/Notice';
import Link from '@/js/components/Link';
// @ts-expect-error SVG module type is not currently declared.
import CloseIcon from '@/svg/icons/close.svg';

interface PDFReportErrorSnackbarProps {
	onRetry?: () => void;
	onDismiss?: (
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) => void;
	onHelpClick?: (
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) => void;
	title?: string;
	description?: ReactNode;
	retryLabel?: string;
	dismissAriaLabel?: string;
}

export default function PDFReportErrorSnackbar( {
	onRetry = () => {},
	onDismiss = () => {},
	onHelpClick,
	title = __(
		'There was a problem generating your report',
		'google-site-kit'
	),
	description,
	retryLabel = __( 'Retry', 'google-site-kit' ),
	dismissAriaLabel = __( 'Dismiss PDF report error', 'google-site-kit' ),
}: PDFReportErrorSnackbarProps ) {
	const helpURL = useSelect(
		( select ) =>
			// @ts-expect-error `googlesitekit-data` select typing is incomplete for this store selector.
			select( CORE_SITE ).getDocumentationLinkURL( 'pdf-reporting' ),
		[]
	);
	const defaultDescription = createInterpolateElement(
		__( 'Please try again or <help>get help</help>.', 'google-site-kit' ),
		{
			help: (
				// @ts-expect-error - The `Link` component is not typed yet.
				<Link href={ helpURL } onClick={ onHelpClick }>
					{ __( 'Get help', 'google-site-kit' ) }
				</Link>
			),
		}
	);

	return (
		<Notice
			// @ts-expect-error - The `Notice` component is not typed yet.
			type={ Notice.TYPES.ERROR }
			className="googlesitekit-notice-snackbar googlesitekit-notice-snackbar--bottom-right googlesitekit-pdf-report-error-snackbar googlesitekit-notice-snackbar--content--small"
			title={ title }
			description={ description || defaultDescription }
			ctaButton={ {
				label: retryLabel,
				onClick: onRetry,
				tertiary: true,
			} }
			dismissButton={ {
				variant: 'icon',
				icon: <CloseIcon width={ 10 } height={ 10 } />,
				ariaLabel: dismissAriaLabel,
				onClick: onDismiss,
			} }
		/>
	);
}
