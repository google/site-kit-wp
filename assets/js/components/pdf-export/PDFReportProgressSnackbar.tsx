/**
 * PDF report progress snackbar.
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
import classnames from 'classnames';
import type { FC, MouseEvent, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';

export interface PDFReportProgressSnackbarProps {
	progress?: number;
	onCancel: (
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) => void;
	title?: string;
	description?: ReactNode;
	cancelLabel?: string;
	className?: string;
}

const PDFReportProgressSnackbar: FC< PDFReportProgressSnackbarProps > = ( {
	progress = 0,
	onCancel,
	title = __( 'Generating your PDF report', 'google-site-kit' ),
	description = __(
		'Please keep this tab open until the download starts automatically',
		'google-site-kit'
	),
	cancelLabel = __( 'Cancel', 'google-site-kit' ),
	className,
} ) => {
	return (
		<Notice
			className={ classnames(
				'googlesitekit-pdf-report-progress-snackbar',
				'googlesitekit-notice-snackbar',
				'googlesitekit-notice-snackbar--bottom-right',
				'googlesitekit-notice-snackbar--content--small',
				className
			) }
			type={ NOTICE_TYPES.INFO_ALT_2 }
			title={ title }
			description={ description }
			dismissButton={ {
				label: cancelLabel,
				onClick: onCancel,
			} }
			hideIcon
		>
			<ProgressBar
				className="googlesitekit-pdf-report-progress-snackbar__progress"
				indeterminate={ false }
				progress={ progress }
				height={ 8 }
				compress
			/>
		</Notice>
	);
};

export default PDFReportProgressSnackbar;
