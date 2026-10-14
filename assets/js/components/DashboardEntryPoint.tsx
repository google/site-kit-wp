/**
 * DashboardEntryPoint component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DashboardMainApp from './DashboardMainApp';
import UserSettingsSelectionPanel from './email-reporting/UserSettingsSelectionPanel';
import IntentRenderer from './intents/IntentRenderer';
import ModuleSetup from './setup/ModuleSetup';

interface DashboardEntryPointProps {
	/** Slug of the module to set up. When set, the module setup flow renders instead of the dashboard. */
	setupModuleSlug?: string;
	/** Slug of the intent to render. When set, the intent screen renders and takes precedence over module setup. */
	intentSlug?: string;
	/** Code the Site Kit Service created for the intent. */
	intentCode?: string;
}

const DashboardEntryPoint: FC< DashboardEntryPointProps > = ( {
	setupModuleSlug,
	intentSlug,
	intentCode,
} ) => {
	if ( !! intentSlug ) {
		return (
			<IntentRenderer
				slug={ intentSlug }
				intentCode={ intentCode || '' }
			/>
		);
	}

	if ( !! setupModuleSlug ) {
		return (
			<Fragment>
				<ModuleSetup moduleSlug={ setupModuleSlug } />
				<UserSettingsSelectionPanel />
			</Fragment>
		);
	}

	return <DashboardMainApp />;
};

export default DashboardEntryPoint;
