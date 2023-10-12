/**
 * Mocks the survey endpoints.
 *
 * @since n.e.x.t
 */
export const mockSurveyEndpoints = () => {
	const surveyTriggerEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/survey-trigger'
	);
	const surveyTimeoutEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/survey-timeout'
	);

	fetchMock.postOnce( surveyTriggerEndpoint, {
		status: 200,
		body: {},
	} );

	fetchMock.getOnce( surveyTimeoutEndpoint, {
		status: 200,
		body: {},
	} );

	fetchMock.postOnce( surveyTimeoutEndpoint, {
		status: 200,
		body: {},
	} );
};
