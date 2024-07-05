/**
 * ModuleDashboardEffects component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import useDashboardType, {
	DASHBOARD_TYPE_ENTITY,
	DASHBOARD_TYPE_MAIN,
} from '../hooks/useDashboardType';

const dashboardTypeComponentMap = {
	[ DASHBOARD_TYPE_MAIN ]: 'DashboardMainEffectComponent',
	[ DASHBOARD_TYPE_ENTITY ]: 'DashboardEntityEffectComponent',
};

export default function ModuleDashboardEffects() {
	const dashboardType = useDashboardType();
	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);

	if ( ! modules ) {
		return null;
	}

	const moduleComponentKey = dashboardTypeComponentMap[ dashboardType ];
	return Object.values( modules ).reduce( ( elements, module ) => {
		const ModuleEffectComponent = module[ moduleComponentKey ];

		if ( ! module.active || ! ModuleEffectComponent ) {
			return elements;
		}

		return [ ...elements, <ModuleEffectComponent key={ module.slug } /> ];
	}, [] );
}
