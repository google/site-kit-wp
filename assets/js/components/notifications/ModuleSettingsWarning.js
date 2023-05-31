/**
 * ModuleSettingsWarning component.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import classnames from 'classnames';
import ErrorIcon from '../../../svg/icons/error.svg';

const { useSelect } = Data;

/*
 * A single module. Keeps track of its own active state and settings.
 */
export default function ModuleSettingsWarning( { slug } ) {
	const error = useSelect( ( select ) =>
		select( CORE_MODULES )?.getCheckRequirementsError( slug )
	);

	if ( ! error ) {
		return null;
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-settings-module-warning',
				'googlesitekit-settings-module-warning--modules-list'
			) }
		>
			<ErrorIcon height="20" width="23" /> { error.message }
		</div>
	);
}
