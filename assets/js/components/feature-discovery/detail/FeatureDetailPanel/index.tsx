/**
 * FeatureDetailPanel component.
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

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY } from '@/js/components/feature-discovery/constants';
import SideSheet from '@/js/components/SideSheet';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import PanelContent from './PanelContent';

const FeatureDetailPanel: FC = () => {
	const featureSlug = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY ),
		[]
	);

	const feature = useSelect(
		( select: Select ): Feature | null =>
			typeof featureSlug === 'string'
				? select( CORE_FEATURE_DISCOVERY ).getFeature( featureSlug )
				: null,
		[ featureSlug ]
	);

	const { setValue } = useDispatch( CORE_UI );

	const onClose = useCallback( () => {
		setValue( FEATURE_DETAIL_PANEL_FEATURE_SLUG_KEY, false );
	}, [ setValue ] );

	return (
		<SideSheet
			className="googlesitekit-feature-details-panel"
			closeSheet={ onClose }
			isOpen={ !! feature }
		>
			{ feature && (
				<PanelContent feature={ feature } onClose={ onClose } />
			) }
		</SideSheet>
	);
};

export default FeatureDetailPanel;
