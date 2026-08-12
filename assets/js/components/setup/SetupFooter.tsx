/**
 * Module setup SetupFooter component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	type Registry,
	type Select,
	useRegistry,
	useSelect,
} from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import ModuleSetupFooter from './ModuleSetupFooter';
import type { ModuleWithSetupComponent, SetupFooterProps } from './types';

export default function SetupFooter( {
	moduleSlug,
	finishSetup,
	onCancel,
}: SetupFooterProps ) {
	const registry = useRegistry() as unknown as Registry;

	const module = useSelect(
		( select: Select ): ModuleWithSetupComponent | undefined =>
			select( CORE_MODULES ).getModule( moduleSlug ),
		[ moduleSlug ]
	);

	const onCompleteSetup = module?.onCompleteSetup;

	const onCompleteSetupCallback = useCallback( () => {
		return onCompleteSetup?.( registry, finishSetup );
	}, [ onCompleteSetup, registry, finishSetup ] );

	if ( ! module ) {
		return null;
	}

	return (
		<ModuleSetupFooter
			module={ module }
			onCancel={ onCancel }
			onComplete={
				typeof onCompleteSetup === 'function'
					? onCompleteSetupCallback
					: undefined
			}
		/>
	);
}
