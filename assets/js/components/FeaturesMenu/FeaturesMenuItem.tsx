/**
 * FeaturesMenuItem component.
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
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';

interface FeaturesMenuItemProps {
	children: ReactNode;
	icon?: ReactNode;
	onClick: () => void;
}

const FeaturesMenuItem: FC< FeaturesMenuItemProps > = ( {
	children,
	icon,
	onClick,
} ) => {
	return (
		<li
			className="googlesitekit-features-menu-item mdc-list-item"
			role="none"
		>
			<Link
				className="mdc-list-item__text"
				role="menuitem"
				onClick={ onClick }
				leadingIcon={ icon }
			>
				{ children }
			</Link>
		</li>
	);
};

export default FeaturesMenuItem;
