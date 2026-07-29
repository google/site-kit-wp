/**
 * Reader Revenue Manager setup layout component.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { type Select, useSelect } from 'googlesitekit-data';
import {
	DefaultModuleSetup,
	SetupHeader,
	useFinishSetup,
} from '@/js/components/setup';
import ExitSetup from '@/js/components/setup/ExitSetup';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';

const SetupLayout: FC = () => {
	const [ expressSetup ] = useQueryArg( 'expressSetup' );
	const finishSetup = useFinishSetup( MODULE_SLUG_READER_REVENUE_MANAGER );

	const module = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).getModule(
				MODULE_SLUG_READER_REVENUE_MANAGER
			),
		[]
	);

	if ( ! module?.SetupComponent ) {
		return null;
	}

	const { SetupComponent } = module;

	if ( expressSetup === 'true' ) {
		return (
			<Fragment>
				<SetupHeader>
					<ExitSetup gaTrackingEventArgs={ {} } />
				</SetupHeader>
				<SetupComponent module={ module } finishSetup={ finishSetup } />
			</Fragment>
		);
	}

	return (
		<DefaultModuleSetup moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER } />
	);
};

export default SetupLayout;
