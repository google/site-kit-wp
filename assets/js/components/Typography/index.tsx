/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { TypographySize, TypographyType } from './constants';

const DEFAULT_TAG_NAME = 'span';

interface TypographyOwnProps {
	className?: string;
	size: TypographySize;
	type: TypographyType;
}

export type TypographyProps< E extends React.ElementType > = {
	as?: E;
} & TypographyOwnProps &
	Omit< React.ComponentPropsWithoutRef< E >, keyof TypographyOwnProps >;

function Typography< E extends React.ElementType = typeof DEFAULT_TAG_NAME >( {
	as,
	className,
	size,
	type,
	...props
}: TypographyProps< E > ) {
	const Component = as || DEFAULT_TAG_NAME;

	return (
		<Component
			className={ classnames(
				'googlesitekit-typography',
				className,
				type && `googlesitekit-typography--${ type }`,
				size && `googlesitekit-typography--${ size }`
			) }
			{ ...props }
		/>
	);
}

export default Typography;
