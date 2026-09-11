/**
 * Reader Revenue Manager express setup CTA settings form section.
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
import { FC, Fragment, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SIZE_SMALL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { ExpressSetupStepDetails } from '@/js/modules/reader-revenue-manager/components/common';
import FormSection from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/FormSection';

interface ComponentProps {
	children: ReactNode;
	note?: ReactNode;
}

const CTASettingsFormSection: FC< ComponentProps > = ( { children, note } ) => {
	return (
		<FormSection
			title={ __( 'CTA settings', 'google-site-kit' ) }
			className="googlesitekit-rrm-express-setup-step__section--cta-settings"
		>
			<div className="googlesitekit-rrm-express-setup-step__form-controls">
				{ children }
				<ExpressSetupStepDetails inline>
					{ ( Item ) => (
						<Fragment>
							<Item
								description={ __(
									'Allowed',
									'google-site-kit'
								) }
								term={ __(
									'Popup dismissal',
									'google-site-kit'
								) }
							/>
							<Item
								description={ __( 'Low', 'google-site-kit' ) }
								term={ __(
									'Frequency cap',
									'google-site-kit'
								) }
							/>
							<Item
								description={ __(
									'24 hours',
									'google-site-kit'
								) }
								term={ __(
									'Max. display frequency',
									'google-site-kit'
								) }
							/>
						</Fragment>
					) }
				</ExpressSetupStepDetails>
				{ note && (
					<P
						className="googlesitekit-rrm-express-setup-step__note"
						size={ SIZE_SMALL }
					>
						{ note }
					</P>
				) }
			</div>
		</FormSection>
	);
};

export default CTASettingsFormSection;
