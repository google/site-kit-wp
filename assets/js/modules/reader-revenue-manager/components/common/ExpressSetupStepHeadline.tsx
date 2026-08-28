/**
 * Reader Revenue Manager express setup headline component.
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
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_HEADLINE,
} from '@/js/components/Typography/constants';
import {
	BREAKPOINT_DESKTOP,
	BREAKPOINT_XLARGE,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';

interface ExpressSetupStepHeadlineProps {
	children?: ReactNode;
	className?: string;
}

const ExpressSetupStepHeadline: FC< ExpressSetupStepHeadlineProps > = ( {
	children,
	className,
} ) => {
	const breakpoint = useBreakpoint();

	const size =
		breakpoint === BREAKPOINT_DESKTOP || breakpoint === BREAKPOINT_XLARGE
			? SIZE_MEDIUM
			: SIZE_SMALL;

	return (
		<Typography
			as="h1"
			className={ classNames(
				'googlesitekit-rrm-express-setup-headline',
				className
			) }
			size={ size }
			type={ TYPE_HEADLINE }
		>
			{ children }
		</Typography>
	);
};

export default ExpressSetupStepHeadline;
