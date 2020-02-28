export const collectReducers = ( initialState, reducers ) => {
	return ( state = initialState, action ) => {
		return reducers.reduce( ( newState, reducer ) => {
			return reducer( newState, action );
		}, state );
	};
};
