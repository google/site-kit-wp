/**
 * AdSense module initialization.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import './datastore';
import { fillFilterWithComponent } from '../../util';
import { SetupMain } from './setup';
import {
	SettingsMain,
	SettingsSetupIncomplete,
} from './settings';
import { AdBlockerWarning } from './common';
import { DashboardZeroData } from './dashboard';

function ConnectedSetupMain( props ) {
	return (
		<Data.RegistryProvider value={ Data }>
			<SetupMain { ...props } />
		</Data.RegistryProvider>
	);
}

function ConnectedSettingsMain( props ) {
	return (
		<Data.RegistryProvider value={ Data }>
			<SettingsMain { ...props } />
		</Data.RegistryProvider>
	);
}

function ConnectedSettingsSetupIncomplete( props ) {
	return (
		<Data.RegistryProvider value={ Data }>
			<SettingsSetupIncomplete { ...props } />
		</Data.RegistryProvider>
	);
}

function ConnectedAdBlockerWarning( props ) {
	return (
		<Data.RegistryProvider value={ Data }>
			<AdBlockerWarning { ...props } />
		</Data.RegistryProvider>
	);
}

function ConnectedDashboardZeroData( props ) {
	return (
		<Data.RegistryProvider value={ Data }>
			<DashboardZeroData { ...props } />
		</Data.RegistryProvider>
	);
}

addFilter(
	'googlesitekit.ModuleSetup-adsense',
	'googlesitekit.AdSenseModuleSetup',
	fillFilterWithComponent( ConnectedSetupMain )
);

addFilter(
	'googlesitekit.ModuleSettingsDetails-adsense',
	'googlesitekit.AdSenseModuleSettings',
	fillFilterWithComponent( ConnectedSettingsMain )
);

addFilter(
	'googlesitekit.ModuleSetupIncomplete',
	'googlesitekit.AdSenseModuleSettingsSetupIncomplete',
	fillFilterWithComponent( ( props ) => {
		const { slug, OriginalComponent } = props;
		if ( 'adsense' !== slug ) {
			return <OriginalComponent { ...props } />;
		}
		return (
			<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
				<ConnectedSettingsSetupIncomplete />
			</div>
		);
	} )
);

addFilter(
	'googlesitekit.ModuleSettingsWarning',
	'googlesitekit.adsenseSettingsWarning',
	fillFilterWithComponent( ( props ) => {
		const { slug, context, OriginalComponent } = props;
		if ( 'adsense' !== slug ) {
			return <OriginalComponent { ...props } />;
		}
		return <ConnectedAdBlockerWarning context={ context } />;
	} )
);

addFilter(
	'googlesitekit.AdSenseDashboardZeroData',
	'googlesitekit.AdSenseDashboardZeroDataRefactored',
	fillFilterWithComponent( ConnectedDashboardZeroData )
);
