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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, type Select } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { PDF_GENERATING_KEY } from '@/js/components/pdf-generation/constants';

interface FooterProps {
	closePanel: () => void;
	hasSelection: boolean;
}

export default function Footer( { closePanel, hasSelection }: FooterProps ) {
	const isGenerating = useSelect(
		( select: Select ) => select( CORE_UI ).getValue( PDF_GENERATING_KEY ),
		[]
	);

	const { setValue } = useDispatch( CORE_UI );

	const onDownloadClick = useCallback( () => {
		// Temporary stub: toggle the "generating" flag so the notice renders.
		// To be replaced by the real orchestrator handoff in #12537.
		setValue( PDF_GENERATING_KEY, true );
	}, [ setValue ] );

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
						disabled={ ! hasSelection || !! isGenerating }
					>
						{ __( 'Download report', 'google-site-kit' ) }
					</Button>
				</div>
			</div>
		</footer>
	);
}
