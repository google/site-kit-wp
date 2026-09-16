/**
 * Reader Revenue Manager express setup details component.
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
import classNames from 'classnames';
import { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_BODY,
} from '@/js/components/Typography/constants';

interface ExpressSetupStepDetailsProps
	extends ComponentPropsWithoutRef< 'dl' > {
	children: (
		Item: FC< {
			description: ReactNode;
			term: ReactNode;
		} >
	) => ReactNode;
	inline?: boolean;
}

const ExpressSetupStepDetails: FC< ExpressSetupStepDetailsProps > = ( {
	children,
	className,
	inline,
	...props
} ) => {
	return (
		<dl
			className={ classNames(
				'googlesitekit-rrm-express-setup-details',
				{
					'googlesitekit-rrm-express-setup-details--inline': inline,
				},
				className
			) }
			{ ...props }
		>
			{ children( ( { description, term } ) => (
				<div className="googlesitekit-rrm-express-setup-details__item">
					<Typography
						as="dt"
						className="googlesitekit-rrm-express-setup-details__term"
						size={ SIZE_SMALL }
						type={ TYPE_BODY }
					>
						{ term }
					</Typography>
					<Typography
						as="dd"
						className="googlesitekit-rrm-express-setup-details__description"
						size={ SIZE_MEDIUM }
						type={ TYPE_BODY }
					>
						{ description }
					</Typography>
				</div>
			) ) }
		</dl>
	);
};

export default ExpressSetupStepDetails;
