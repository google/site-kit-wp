/**
 * Recent activity message component.
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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_HEADLINE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';

export interface RecentActivityMessageProps {
	/** Extra class for the message, such as the class of the state it shows. */
	className?: string;
	/** The illustration above the title. */
	illustration: ReactNode;
	/** The title under the illustration, such as `No recent activity data found`. */
	title: string;
	/** The sentences under the title, each on a line of its own on desktop, and flowing as one paragraph on smaller screens. */
	sentences: ReactNode[];
}

const RecentActivityMessage: FC< RecentActivityMessageProps > = ( {
	className,
	illustration,
	title,
	sentences,
} ) => {
	return (
		<div
			className={ classnames(
				'googlesitekit-traffic-overview__recent-activity-message',
				className
			) }
		>
			<div className="googlesitekit-traffic-overview__recent-activity-message-illustration">
				{ illustration }
			</div>
			<Typography
				as="h3"
				type={ TYPE_HEADLINE }
				size={ SIZE_SMALL }
				className="googlesitekit-traffic-overview__recent-activity-message-title"
			>
				{ title }
			</Typography>
			<div className="googlesitekit-traffic-overview__recent-activity-message-description">
				<P size={ SIZE_MEDIUM }>
					{ sentences.map( ( sentence, index ) => (
						<Fragment key={ index }>
							{ /* The space keeps the sentences apart where they share a line. */ }
							{ index > 0 && ' ' }
							<span className="googlesitekit-traffic-overview__recent-activity-message-sentence">
								{ sentence }
							</span>
						</Fragment>
					) ) }
				</P>
			</div>
		</div>
	);
};

export default RecentActivityMessage;
