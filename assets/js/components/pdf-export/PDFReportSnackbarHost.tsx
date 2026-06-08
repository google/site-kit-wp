/**
 * PDF report snackbar host: projects `core/pdf` status into the right snackbar.
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
import { FC, MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { triggerDownload } from './pdf-utils';
import PDFReportErrorSnackbar from './PDFReportErrorSnackbar';
import PDFReportProgressSnackbar from './PDFReportProgressSnackbar';
import PDFReportSuccessSnackbar from './PDFReportSuccessSnackbar';

interface PDFReportSnackbarHostProps {
	onRetry?: () => void;
}

const PDFReportSnackbarHost: FC< PDFReportSnackbarHostProps > = ( {
	onRetry = () => {},
} ) => {
	const status = useSelect(
		( select: Select ) => select( CORE_PDF ).getStatus(),
		[]
	);
	const progress = useSelect(
		( select: Select ) => select( CORE_PDF ).getProgress(),
		[]
	);
	const { url: blobURL, filename: blobFilename } = useSelect(
		( select: Select ) => select( CORE_PDF ).getBlob(),
		[]
	);

	const { requestCancel, clearExport } = useDispatch( CORE_PDF );

	// Re-downloads the already-generated PDF from the existing blob without
	// re-running the export. The blob is the source of truth, so no store
	// action is dispatched here.
	const handleRetryDownload = useCallback(
		( event: MouseEvent< HTMLAnchorElement | HTMLButtonElement > ) => {
			event.preventDefault();

			if ( blobURL && blobFilename ) {
				triggerDownload( blobURL, blobFilename );
			}
		},
		[ blobURL, blobFilename ]
	);

	// Clearing the export resets `status` back to `'idle'` so the error
	// snackbar unmounts, then the parent re-opens the side sheet panel.
	// `clearExport()` leaves `selection` untouched so the panel still
	// reflects the user's previous picks.
	const handleErrorRetry = useCallback( () => {
		clearExport();
		onRetry();
	}, [ clearExport, onRetry ] );

	if ( status === 'progress' ) {
		return (
			<PDFReportProgressSnackbar
				progress={ ( progress ?? 0 ) / 100 }
				onCancel={ requestCancel }
			/>
		);
	}

	if ( status === 'success' ) {
		const description = createInterpolateElement(
			__(
				'The PDF report has been automatically downloaded to your downloads folder. If the download doesn’t start automatically, you can manually <a>download your report</a>.',
				'google-site-kit'
			),
			{
				a: (
					<Link
						href={ blobURL || '#' }
						onClick={ handleRetryDownload }
					/>
				),
			}
		);

		return (
			<PDFReportSuccessSnackbar
				description={ description }
				onDismiss={ clearExport }
				onAutoDismiss={ clearExport }
			/>
		);
	}

	if ( status === 'error' ) {
		return (
			<PDFReportErrorSnackbar
				onRetry={ handleErrorRetry }
				onDismiss={ clearExport }
			/>
		);
	}

	return null;
};

export default PDFReportSnackbarHost;
