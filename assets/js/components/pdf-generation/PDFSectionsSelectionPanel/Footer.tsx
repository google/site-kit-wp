/**
 * PDF Sections Selection Panel Footer.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import {
	PDF_DOWNLOAD_PANEL_OPENED_KEY,
	PDF_EXPORTING_KEY,
} from '@/js/components/pdf-generation/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';

interface FooterProps {
	closePanel: () => void;
	hasSelection: boolean;
}

const Footer: FC< FooterProps > = ( { closePanel, hasSelection } ) => {
	const isExporting = useSelect(
		( select: Select ) => select( CORE_UI ).getValue( PDF_EXPORTING_KEY ),
		[]
	);
	const exportStatus = useSelect(
		( select: Select ) => select( CORE_PDF ).getStatus(),
		[]
	);

	const { setValue } = useDispatch( CORE_UI );

	const onDownloadClick = useCallback( () => {
		setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, false );
		setValue( PDF_EXPORTING_KEY, true );
	}, [ setValue ] );

	const inFlight = !! isExporting || exportStatus === 'progress';

	return (
		<footer className="googlesitekit-selection-panel-footer googlesitekit-pdf-download-panel__footer">
			<div className="googlesitekit-selection-panel-footer__content">
				<div className="googlesitekit-selection-panel-footer__actions">
					{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
					<Button onClick={ closePanel } tertiary>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Button>
					{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
					<Button
						onClick={ onDownloadClick }
						disabled={ ! hasSelection || inFlight }
					>
						{ __( 'Download report', 'google-site-kit' ) }
					</Button>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
