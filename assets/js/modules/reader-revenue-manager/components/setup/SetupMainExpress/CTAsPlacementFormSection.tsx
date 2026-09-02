/**
 * Reader Revenue Manager express setup CTAs placement form section.
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
import { Select, useSelect } from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';
import {
	PostTypesSelect,
	SnippetModeSelect,
} from '@/js/modules/reader-revenue-manager/components/common';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import FormSection from './FormSection';

const CTAsPlacementFormSection: FC = () => {
	const snippetMode: string | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getSnippetMode(),
		[]
	);

	return (
		<FormSection
			title={ __( 'CTAs placement', 'google-site-kit' ) }
			className="googlesitekit-rrm-express-setup-step__section--ctas-placement"
		>
			<div className="googlesitekit-rrm-express-setup-step__form-controls">
				<div className="googlesitekit-rrm-express-setup-step__form-input googlesitekit-rrm-express-setup-step__snippet-mode">
					<SnippetModeSelect
						helperText={ __(
							'Use the new settings in the block editor to customize where your CTAs appear',
							'google-site-kit'
						) }
					/>
				</div>

				{ snippetMode === 'post_types' && (
					<div className="googlesitekit-rrm-express-setup-step__form-input googlesitekit-rrm-express-setup-step__post-types">
						<Typography
							as="h3"
							className="googlesitekit-rrm-express-setup-step__post-types-title"
							size={ SIZE_SMALL }
							type={ TYPE_BODY }
						>
							{ __(
								'Select the content types where you want your CTAs to appear:',
								'google-site-kit'
							) }
						</Typography>
						<PostTypesSelect hasModuleAccess />
					</div>
				) }
			</div>
		</FormSection>
	);
};

export default CTAsPlacementFormSection;
