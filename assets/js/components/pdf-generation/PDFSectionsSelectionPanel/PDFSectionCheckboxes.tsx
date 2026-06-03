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
import { PDFSection } from '@/js/components/pdf-generation/constants';
import Typography from '@/js/components/Typography';

interface PDFSectionCheckboxesProps {
	sections: PDFSection[];
	selectedWidgetSlugs: string[];
	toggleSection: ( section: PDFSection ) => void;
	toggleWidget: ( widgetSlug: string ) => void;
}

const PDFSectionCheckboxes: FC< PDFSectionCheckboxesProps > = ( {
	sections,
	selectedWidgetSlugs,
	toggleSection,
	toggleWidget,
} ) => {
	return (
		<div
			className="googlesitekit-pdf-download-panel__sections"
			role="group"
			aria-label={ __( 'PDF report sections', 'google-site-kit' ) }
		>
			{ sections.map( ( section ) => {
				const selectedCount = section.widgetSlugs.filter( ( slug ) =>
					selectedWidgetSlugs.includes( slug )
				).length;
				const sectionChecked =
					section.widgetSlugs.length > 0 &&
					selectedCount === section.widgetSlugs.length;
				const sectionIndeterminate =
					selectedCount > 0 &&
					selectedCount < section.widgetSlugs.length;

				return (
					<div
						key={ section.slug }
						className="googlesitekit-pdf-download-panel__section-group"
					>
						<div className="googlesitekit-pdf-download-panel__section">
							<Checkbox
								id={ `pdf-download-section-${ section.slug }` }
								name={ `pdf-download-section-${ section.slug }` }
								value={ section.slug }
								checked={ sectionChecked }
								indeterminate={ sectionIndeterminate }
								onChange={ () => toggleSection( section ) }
							>
								{ /* @ts-expect-error - The `Typography` component does not yet expose `className` as optional. */ }
								<Typography
									type="title"
									size="medium"
									as="span"
								>
									{ section.label }
								</Typography>
							</Checkbox>
						</div>
						{ section.widgets.map( ( widget ) => (
							<div
								key={ widget.slug }
								className="googlesitekit-pdf-download-panel__sub-section"
							>
								<Checkbox
									id={ `pdf-download-widget-${ widget.slug }` }
									name={ `pdf-download-widget-${ widget.slug }` }
									value={ widget.slug }
									checked={ selectedWidgetSlugs.includes(
										widget.slug
									) }
									onChange={ () =>
										toggleWidget( widget.slug )
									}
								>
									{ /* @ts-expect-error - The `Typography` component does not yet expose `className` as optional. */ }
									<Typography
										type="body"
										size="medium"
										as="span"
									>
										{ widget.label }
									</Typography>
								</Checkbox>
							</div>
						) ) }
					</div>
				);
			} ) }
		</div>
	);
};

export default PDFSectionCheckboxes;
