/**
 * Toolbar addon component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import React, { useState, useEffect } from 'react';
import {
	IconButton,
	TooltipLinkList,
	WithTooltip,
} from '@storybook/components';
import { FlagIcon } from '@storybook/icons';

/**
 * Internal dependencies
 */
import { ADDON_ID, EVENTS } from './constants';

const AVAILABLE_FEATURES = [
	'adsPax',
	'googleTagGateway',
	'gtagUserData',
	'privacySandboxModule',
	'proactiveUserEngagement',
	'setupFlowRefresh',
	'conversionReporting',
];

export function ToolbarAddon( { api } ) {
	const [ isActive, setIsActive ] = useState( false );
	const [ enabledFeatures, setEnabledFeatures ] = useState( new Set() );

	useEffect( () => {
		function handleFeaturesUpdated( { features } ) {
			setEnabledFeatures( new Set( features ) );
		}

		api.on( EVENTS.FEATURES_UPDATED, handleFeaturesUpdated );

		return () => {
			api.off( EVENTS.FEATURES_UPDATED, handleFeaturesUpdated );
		};
	}, [ api ] );

	function toggleFeature( feature ) {
		const newFeatures = new Set( enabledFeatures );
		if ( newFeatures.has( feature ) ) {
			newFeatures.delete( feature );
		} else {
			newFeatures.add( feature );
		}

		const featuresArray = Array.from( newFeatures );

		api.emit( EVENTS.TOGGLE_FEATURE, { features: featuresArray } );
	}

	const links = AVAILABLE_FEATURES.map( ( feature ) => ( {
		id: feature,
		title: feature,
		active: enabledFeatures.has( feature ),
		onClick: () => toggleFeature( feature ),
	} ) );
	return (
		<WithTooltip
			placement="bottom"
			trigger="click"
			tooltip={ <TooltipLinkList links={ links } /> }
			onVisibilityChange={ setIsActive }
			closeOnOutsideClick
		>
			<IconButton
				key={ ADDON_ID }
				active={ isActive }
				title="Site Kit Feature Flags"
			>
				<FlagIcon />
			</IconButton>
		</WithTooltip>
	);
}
