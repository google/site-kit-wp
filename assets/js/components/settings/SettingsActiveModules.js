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
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import Layout from '../layout/Layout';
import SettingsActiveModule from './SettingsActiveModule';
const { useSelect } = Data;

export default function SettingsActiveModules() {
	// We store `initialActiveSlugs` separately to avoid
	// layout shifts when deactivating a module as it would otherwise
	// cause the module to be removed upon deactivation.
	const [ initialActiveSlugs, setInitialActiveSlugs ] = useState();
	const modules = useSelect( ( select ) => select( CORE_MODULES ).getModules() );

	useEffect( () => {
		// Only set initialActiveSlugs once, as soon as modules are available.
		if ( ! modules || initialActiveSlugs !== undefined ) {
			return;
		}

		const activeSlugs = Object.keys( modules )
			.filter( ( slug ) => modules[ slug ].active );

		setInitialActiveSlugs( activeSlugs );
	}, [ modules, initialActiveSlugs ] );

	if ( ! initialActiveSlugs ) {
		return null;
	}

	const activeModules = initialActiveSlugs
		.map( ( slug ) => modules[ slug ] )
		.filter( ( module ) => ! module.internal )
		.sort( ( a, b ) => a.order - b.order );

	return (
		<Layout>
			{ activeModules.map( ( { slug } ) => (
				<SettingsActiveModule
					key={ slug }
					slug={ slug }
				/>
			) ) }
		</Layout>
	);
}
