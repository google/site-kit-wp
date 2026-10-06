/**
 * PanelContent component.
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
import { FC, Fragment } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId as useInstanceID } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';
import PanelFooter from './PanelFooter';
import PanelHeader from './PanelHeader';

interface PanelContentProps {
	feature: Feature;
	initialActiveIndex?: number;
	onClose: () => void;
}

interface FeatureDetailPanelTab {
	Component: FC< { feature: Feature } >;
	tabID: string;
	tabPanelID: string;
	label: string;
}

const PanelContent: FC< PanelContentProps > = ( {
	feature,
	initialActiveIndex = 0,
	onClose,
} ) => {
	const breakpoint = useBreakpoint();

	const [ activeIndex, setActiveIndex ] = useState( initialActiveIndex );

	const baseID = useInstanceID(
		PanelContent,
		'feature-detail-panel-content'
	);

	const tabs: FeatureDetailPanelTab[] = [
		{
			// TODO: #13331 -- Pass FeatureDetailDescription.
			Component: () => <code>&lt;FeatureDetailDescription /&gt;</code>,
			tabID: `${ baseID }-tab-description`,
			tabPanelID: `${ baseID }-panel-description`,
			label: __( 'Description', 'google-site-kit' ),
		},
		{
			// TODO: #13331 -- Pass FeatureDetailRequirements.
			Component: () => <code>&lt;FeatureDetailRequirements /&gt;</code>,
			tabID: `${ baseID }-tab-requirements`,
			tabPanelID: `${ baseID }-panel-requirements`,
			label: __( 'Requirements', 'google-site-kit' ),
		},
		{
			// TODO: #13331 -- Pass FeatureDetailScreenshots.
			Component: () => <code>&lt;FeatureDetailScreenshots /&gt;</code>,
			tabID: `${ baseID }-tab-screenshots`,
			tabPanelID: `${ baseID }-panel-screenshots`,
			label: __( 'Screenshots', 'google-site-kit' ),
		},
	];

	const size = breakpoint === BREAKPOINT_SMALL ? SIZE_SMALL : SIZE_MEDIUM;

	return (
		<Fragment>
			<PanelHeader feature={ feature } onClose={ onClose }>
				<TabBar
					activeIndex={ activeIndex }
					className="googlesitekit-tab-bar--start-aligned-high-contrast googlesitekit-feature-details-panel__tab-bar"
					handleActiveIndexUpdate={ setActiveIndex }
				>
					{ tabs.map( ( { label, tabID, tabPanelID } ) => (
						<Tab
							aria-controls={ tabPanelID }
							focusOnActivate={ false }
							id={ tabID }
							key={ tabID }
						>
							<Typography
								className="mdc-tab__text-label"
								size={ size }
								type={ TYPE_LABEL }
							>
								{ label }
							</Typography>
						</Tab>
					) ) }
				</TabBar>
			</PanelHeader>
			{ tabs.map(
				( { Component, tabID, tabPanelID }, index ) =>
					index === activeIndex && (
						<div
							aria-labelledby={ tabID }
							className="googlesitekit-feature-details-panel__content"
							id={ tabPanelID }
							key={ tabPanelID }
							role="tabpanel"
							tabIndex={ 0 }
						>
							<Component feature={ feature } />
						</div>
					)
			) }
			<PanelFooter feature={ feature } onClose={ onClose } />
		</Fragment>
	);
};

export default PanelContent;
