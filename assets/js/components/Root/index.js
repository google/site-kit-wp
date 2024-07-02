/**
 * Root component.
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
import PropTypes from 'prop-types';
import {
	ThemeProvider,
	createMuiTheme,
	// We're using the to avoid `StrictMode` warnings. It's a temporary
	// workaround until we can upgrade `material-ui/core` to v5+.
	// See: https://github.com/google/site-kit-wp/issues/5378
	unstable_createMuiStrictModeTheme, // eslint-disable-line camelcase
} from '@material-ui/core';

/**
 * WordPress dependencies
 */
import { StrictMode, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data, { RegistryProvider } from 'googlesitekit-data';
import ErrorHandler from '../ErrorHandler';
import FeaturesProvider from '../FeaturesProvider';
import { enabledFeatures } from '../../features';
import PermissionsModal from '../PermissionsModal';
import RestoreSnapshots from '../RestoreSnapshots';
import { FeatureToursDesktop } from '../FeatureToursDesktop';
import { Provider as ViewContextProvider } from './ViewContextContext';
import InViewProvider from '../InViewProvider';
import { isSiteKitScreen } from '../../util/is-site-kit-screen';

export default function Root( { children, registry, viewContext = null } ) {
	const theme =
		process.env.NODE_ENV === 'production'
			? createMuiTheme
			: unstable_createMuiStrictModeTheme; // eslint-disable-line camelcase

	const [ inViewState ] = useState( {
		key: 'Root',
		value: true,
	} );

	return (
		<StrictMode>
			<InViewProvider value={ inViewState }>
				<RegistryProvider value={ registry }>
					<FeaturesProvider value={ enabledFeatures }>
						<ViewContextProvider value={ viewContext }>
							<ThemeProvider theme={ theme() }>
								<ErrorHandler>
									<RestoreSnapshots>
										{ children }
										{ /*
											TODO: Replace `FeatureToursDesktop` with `FeatureTours`
											once tour conflicts in smaller viewports are resolved.
											@see https://github.com/google/site-kit-wp/issues/3003
										*/ }
										{ viewContext && (
											<FeatureToursDesktop />
										) }
									</RestoreSnapshots>
									{ isSiteKitScreen( viewContext ) && (
										<PermissionsModal />
									) }
								</ErrorHandler>
							</ThemeProvider>
						</ViewContextProvider>
					</FeaturesProvider>
				</RegistryProvider>
			</InViewProvider>
		</StrictMode>
	);
}

Root.propTypes = {
	children: PropTypes.node,
	registry: PropTypes.object,
	viewContext: PropTypes.string.isRequired,
};

Root.defaultProps = {
	registry: Data,
};
