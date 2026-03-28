/**
 * Storybook addon manager registration.
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
import React from 'react';
import { addons, types } from '@storybook/manager-api';

/**
 * Internal dependencies
 */
import { ADDON_ID } from './constants';
import { ToolbarAddon } from './ToolbarAddon';

addons.register( ADDON_ID, ( api ) => {
	const title = 'Site Kit Toolbar';

	addons.add( ADDON_ID, {
		title,
		type: types.TOOL,
		match: ( { viewMode } ) => [ 'story', 'docs' ].includes( viewMode ),
		render: () => <ToolbarAddon api={ api } />,
	} );
} );
