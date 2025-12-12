/**
 * Storybook-specific FeaturesProvider with state management.
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
import { addons } from '@storybook/preview-api';

/**
 * Internal dependencies
 */
import FeaturesContext from '../../assets/js/components/FeaturesProvider/FeaturesContext';

export default function StorybookFeaturesProvider( {
	children,
	features: initialFeatures = [],
} ) {
	const [ enabledFeatures, setEnabledFeatures ] = useState(
		() => new Set( initialFeatures )
	);
	const channel = addons.getChannel();

	useEffect( () => {
		function handleToggleFeature( { features } ) {
			setEnabledFeatures( new Set( features ) );
		}

		channel.on(
			'storybook/sitekit-toolbar/toggle-feature',
			handleToggleFeature
		);

		return () => {
			channel.off(
				'storybook/sitekit-toolbar/toggle-feature',
				handleToggleFeature
			);
		};
	}, [ channel ] );

	useEffect( () => {
		const featuresArray = Array.from( enabledFeatures );
		channel.emit( 'storybook/sitekit-toolbar/features-updated', {
			features: featuresArray,
		} );
	}, [ enabledFeatures, channel ] );

	return (
		<FeaturesContext.Provider value={ enabledFeatures }>
			{ children }
		</FeaturesContext.Provider>
	);
}
