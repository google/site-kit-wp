import { isFeatureEnabled } from '../../../features';

export default {
	initialState: {
		wasFeatureEnabled: {},
	},
	actions: {
		checkFeatureEnabled( feature ) {
			return {
				type: 'CHECK_FEATURE_ENABLED',
				payload: {
					feature,
					isEnabled: isFeatureEnabled( feature ),
				},
			};
		},
	},
	selectors: {
		wasFeatureEnabled( state, feature ) {
			return state.wasFeatureEnabled[ feature ] ?? false;
		},
	},
	reducer( state, action ) {
		switch ( action.type ) {
			case 'CHECK_FEATURE_ENABLED':
				return {
					...state,
					wasFeatureEnabled: {
						...state.wasFeatureEnabled,
						[ action.payload.feature ]: action.payload.isEnabled,
					},
				};
			default:
				return state;
		}
	},
};
