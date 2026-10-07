/**
 * PanelHeader component.
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
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import FeatureServiceIdentity from '@/js/components/feature-discovery/FeatureServiceIdentity';
import { SelectionPanelHeader } from '@/js/components/SelectionPanel';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';

interface PanelHeaderProps {
	children?: ReactNode;
	feature: Feature;
	onClose: () => void;
}

const PanelHeader: FC< PanelHeaderProps > = ( {
	children,
	feature,
	onClose,
} ) => {
	return (
		<div className="googlesitekit-feature-details-panel__header">
			<SelectionPanelHeader
				onCloseClick={ onClose }
				title={ feature.title }
			>
				<FeatureServiceIdentity feature={ feature } />
			</SelectionPanelHeader>
			{ children }
		</div>
	);
};

export default PanelHeader;
