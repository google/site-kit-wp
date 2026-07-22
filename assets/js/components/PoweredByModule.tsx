/**
 * PoweredByModule component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

export interface PoweredByModuleProps {
	slug: string;
}

export default function PoweredByModule( { slug }: PoweredByModuleProps ) {
	const { Icon, name } = useSelect(
		( select: Select ) => select( CORE_MODULES ).getModule( slug ),
		[ slug ]
	);

	const text = sprintf(
		// translators: %s: Module name.
		__( 'Powered by %s', 'google-site-kit' ),
		name
	);

	const className = classnames(
		'googlesitekit-powered-by-module',
		`googlesitekit-powered-by-module--${ slug }`
	);

	return (
		<div className={ className }>
			<Icon
				aria-hidden="true"
				className="googlesitekit-powered-by-module__icon"
			/>
			<Typography
				as="div"
				className="googlesitekit-powered-by-module__text"
				size={ SIZE_SMALL }
				type={ TYPE_BODY }
			>
				{ text }
			</Typography>
		</div>
	);
}
