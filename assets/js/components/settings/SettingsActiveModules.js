/**
 * SettingsActiveModules component.
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
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import Layout from '../layout/Layout';
import SettingsActiveModule from './SettingsActiveModule';

export default function SettingsActiveModules() {
	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);

	if ( ! modules ) {
		return null;
	}

	const activeModules = Object.keys( modules )
		.map( ( slug ) => modules[ slug ] )
		.filter( ( { internal, active } ) => ! internal && active )
		.sort( ( a, b ) => a.order - b.order );

	return (
		<Layout rounded>
			{ activeModules.map( ( { slug } ) => (
				<SettingsActiveModule key={ slug } slug={ slug } />
			) ) }
		</Layout>
	);
}
