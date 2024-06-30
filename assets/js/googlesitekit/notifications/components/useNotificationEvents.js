import { useCallback } from '@wordpress/element';
import useViewContext from '../../../hooks/useViewContext';
import { trackEvent } from '../../../util';

export default function useNotificationEvents( id ) {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_${ id }-notification`;

	const view = useCallback(
		( ...args ) => {
			return trackEvent( eventCategory, 'view_notification', ...args );
		},
		[ eventCategory ]
	);

	const confirm = useCallback(
		( ...args ) => {
			return trackEvent( eventCategory, 'confirm_notification', ...args );
		},
		[ eventCategory ]
	);

	const dismiss = useCallback(
		( ...args ) => {
			return trackEvent( eventCategory, 'dismiss_notification', ...args );
		},
		[ eventCategory ]
	);

	const clickLearnMore = useCallback(
		( ...args ) => {
			return trackEvent(
				eventCategory,
				'click_learn_more_link',
				...args
			);
		},
		[ eventCategory ]
	);

	return {
		view,
		confirm,
		dismiss,
		clickLearnMore,
	};
}
