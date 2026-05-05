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
 * Internal dependencies
 */
import Notice, { NoticeProps } from '@/js/components/Notice';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { Grid, Cell, Row } from '@/js/material-components';
import { FC, MouseEvent, ReactNode } from 'react';
import { GATrackingEventArgs } from '@/js/types/GATrackingEventArgs';
import { DismissButtonProps } from '@/js/components/Notice/DismissButton';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';

interface NoticeNotificationProps {
	notificationID: string;
	children?: ReactNode;
	title?: ReactNode;
	description?: ReactNode;
	dismissButton?: DismissButtonProps;
	ctaButton?: Record< string, unknown >;
	gaTrackingEventArgs?: GATrackingEventArgs;
	type: NOTICE_TYPES;
}

const NoticeNotification: FC< NoticeNotificationProps & NoticeProps > = ( {
	notificationID,
	dismissButton,
	ctaButton,
	gaTrackingEventArgs,
	...props
} ) => {
	const trackEvents = useNotificationEvents(
		notificationID,
		gaTrackingEventArgs?.category
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	async function handleDismissWithTrackEvent(
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) {
		await dismissButton?.onClick?.( event );
		trackEvents.dismiss(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		dismissNotification( notificationID, {
			...( dismissButton?.dismissOptions || {} ),
		} );
	}

	async function handleCTAClickWithTrackEvent(
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) {
		trackEvents.confirm(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);

		// @ts-ignore TODO: Add types for the `ctaButton` prop.
		await ctaButton?.onClick?.( event );

		if ( ctaButton?.dismissOnClick ) {
			dismissNotification( notificationID, {
				// @ts-ignore TODO: Add types for the `ctaButton` prop.
				...ctaButton?.dismissOptions,
			} );
		}
	}

	return (
		/* @ts-expect-error `<Grid>` component is not yet typed. */
		<Grid>
			{ /* @ts-expect-error `<Row>` component is not yet typed. */ }
			<Row>
				<Cell size={ 12 } alignMiddle>
					<Notice
						dismissButton={ {
							...dismissButton,
							onClick: handleDismissWithTrackEvent,
						} }
						ctaButton={ {
							...ctaButton,
							onClick: handleCTAClickWithTrackEvent,
						} }
						{ ...props }
					/>
				</Cell>
			</Row>
		</Grid>
	);
};

export default NoticeNotification;
