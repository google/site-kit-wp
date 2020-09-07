/**
 * Optimize Settings form.
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { isValidOptimizeID } from '../../util';
import ErrorText from '../../../../components/error-text';
import {
	AMPExperimentJSONField,
	OptimizeIDField,
	UseSnippetInstructions,
	OptimizeIDFieldInstructions,
} from '../common/';
import StoreErrorNotice from '../../../../components/StoreErrorNotice';
const { useSelect } = Data;

export default function SettingsForm() {
	const optimizeID = useSelect( ( select ) => select( STORE_NAME ).getOptimizeID() );

	return (
		<div className="googlesitekit-optimize-settings-fields">
			<StoreErrorNotice moduleName={ _x( 'Optimize', 'Service name', 'google-site-kit' ) } storeName={ STORE_NAME } />

			<OptimizeIDFieldInstructions />

			<div className="googlesitekit-setup-module__inputs">
				<OptimizeIDField />
			</div>

			{ ( ! isValidOptimizeID( optimizeID ) && optimizeID ) &&
				<ErrorText message={ __( 'Not a valid Optimize ID.', 'google-site-kit' ) } />
			}

			<AMPExperimentJSONField />

			<UseSnippetInstructions />
		</div>
	);
}
