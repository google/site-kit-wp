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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ErrorHandler from '../ErrorHandler';
import FeaturesProvider from '../FeaturesProvider';
import { enabledFeatures } from '../../features';
import PermissionsModal from '../PermissionsModal';
import RestoreSnapshots from '../RestoreSnapshots';
import CollectModuleData from '../data/collect-module-data';
import { FeatureToursDesktop } from '../FeatureToursDesktop';
import { useFeature } from '../../hooks/useFeature';
import CurrentSurvey from '../surveys/CurrentSurvey';

export default function Root( {
	children,
	registry,
	viewContext = null,
	// TODO: Remove legacy dataAPI prop support once phased out.
	dataAPIContext,
	dataAPIModuleArgs,
} ) {
	const userFeedbackEnabled = useFeature( 'userFeedback' );

	return (
		<Data.RegistryProvider value={ registry }>
			<FeaturesProvider value={ enabledFeatures }>
				<ErrorHandler viewContext={ viewContext }>
					<RestoreSnapshots>
						{ children }
						{ /*
							TODO: Replace `FeatureToursDesktop` with `FeatureTours`
							once tour conflicts in smaller viewports are resolved.
							@see https://github.com/google/site-kit-wp/issues/3003
						*/ }
						{ viewContext && <FeatureToursDesktop viewContext={ viewContext } /> }
						{ dataAPIContext && (
						// Legacy dataAPI support.
							<CollectModuleData context={ dataAPIContext } args={ dataAPIModuleArgs } />
						) }

						{ userFeedbackEnabled && <CurrentSurvey /> }
					</RestoreSnapshots>
					<PermissionsModal />
				</ErrorHandler>
			</FeaturesProvider>
		</Data.RegistryProvider>
	);
}

Root.propTypes = {
	children: PropTypes.node.isRequired,
	registry: PropTypes.object,
	viewContext: PropTypes.string,
	dataAPIContext: PropTypes.string,
	dataAPIModuleArgs: PropTypes.object,
};

Root.defaultProps = {
	registry: Data,
};
