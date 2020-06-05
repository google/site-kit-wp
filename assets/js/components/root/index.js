/**
 * Root component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ErrorHandler from '../ErrorHandler';
import PermissionsModal from '../permissions-modal';
import RestoreSnapshots from '../restore-snapshots';
import CollectModuleData from '../data/collect-module-data';

export default function Root( {
	children,
	registry,
	// TODO: Remove legacy dataAPI prop support once phased out.
	dataAPIContext,
	dataAPIModuleArgs,
} ) {
	return (
		<Data.RegistryProvider value={ registry }>
			<ErrorHandler>
				<RestoreSnapshots>
					{ children }
					{ dataAPIContext && (
						// Legacy dataAPI support.
						<CollectModuleData context={ dataAPIContext } args={ dataAPIModuleArgs } />
					) }
				</RestoreSnapshots>
				<PermissionsModal />
			</ErrorHandler>
		</Data.RegistryProvider>
	);
}

Root.propTypes = {
	children: PropTypes.node.isRequired,
	registry: PropTypes.object,
	dataAPIContext: PropTypes.string,
	dataAPIModuleArgs: PropTypes.object,
};

Root.defaultProps = {
	registry: Data,
};
