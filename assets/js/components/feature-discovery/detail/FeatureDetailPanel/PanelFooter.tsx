/**
 * PanelFooter component.
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
import { Button } from 'googlesitekit-components';
import FeatureCTA from '@/js/components/feature-discovery/FeatureCTA';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';

interface PanelFooterProps {
	feature: Feature;
	onClose: () => void;
}

const PanelFooter: FC< PanelFooterProps > = ( { feature, onClose } ) => (
	<footer className="googlesitekit-feature-details-panel__footer">
		<div className="googlesitekit-feature-details-panel__relevancy">
			{ /* TODO: #13337 -- Add relevancy feedback controls. */ }
			<code>&lt;ThumbsSurveyTrigger /&gt;</code>
		</div>

		<div className="googlesitekit-feature-details-panel__actions">
			{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
			<Button onClick={ onClose } tertiary>
				{ __( 'Cancel', 'google-site-kit' ) }
			</Button>

			<FeatureCTA slug={ feature.slug } onSetupComplete={ onClose } />
		</div>
	</footer>
);

export default PanelFooter;
