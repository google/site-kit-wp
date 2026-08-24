/**
 * External dependencies
 */
import { FC, MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import TroubleshootingLink from '@/js/components/TroubleshootingLink';

interface PublicationSetupErrorNoticeProps {
	error: object;
	onRetry?: () => void;
	title: string;
}

const PublicationSetupErrorNotice: FC< PublicationSetupErrorNoticeProps > = ( {
	error,
	onRetry,
	title,
} ) => {
	function onClick( event: MouseEvent< HTMLButtonElement > ) {
		event.preventDefault();

		if ( onRetry ) {
			onRetry();
		}
	}

	return (
		<Notice
			ctaButton={
				onRetry
					? {
							label: __( 'Retry', 'google-site-kit' ),
							onClick,
					  }
					: undefined
			}
			description={ createInterpolateElement(
				__( 'Try again or <a>get help</a>', 'google-site-kit' ),
				{
					a: <TroubleshootingLink error={ error } />,
				}
			) }
			title={ title }
			type={ NOTICE_TYPES.ERROR }
		/>
	);
};

export default PublicationSetupErrorNotice;
