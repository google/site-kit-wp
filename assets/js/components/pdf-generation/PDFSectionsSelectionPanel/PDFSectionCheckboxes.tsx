/**
 * PDF Section Checkboxes component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';
import { PDF_SECTIONS } from '@/js/components/pdf-generation/constants';
import Typography from '@/js/components/Typography';

interface PDFSectionCheckboxesProps {
	selectedSections: string[];
	toggleSection: ( slug: string ) => void;
}

const PDFSectionCheckboxes: FC< PDFSectionCheckboxesProps > = ( {
	selectedSections,
	toggleSection,
} ) => {
	return (
		<div
			className="googlesitekit-pdf-download-panel__sections"
			role="group"
			aria-label={ __( 'PDF report sections', 'google-site-kit' ) }
		>
			{ PDF_SECTIONS.map( ( { slug, title } ) => (
				<div
					key={ slug }
					className="googlesitekit-pdf-download-panel__section"
				>
					<Checkbox
						id={ `pdf-download-section-${ slug }` }
						name={ `pdf-download-section-${ slug }` }
						value={ slug }
						checked={ selectedSections.includes( slug ) }
						onChange={ () => toggleSection( slug ) }
					>
						{ /* @ts-expect-error - The `Typography` component does not yet expose `className` as optional. */ }
						<Typography type="title" size="medium" as="span">
							{ title }
						</Typography>
					</Checkbox>
				</div>
			) ) }
		</div>
	);
};

export default PDFSectionCheckboxes;
