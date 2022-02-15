export function mockLocation() {
	let oldLocation;
	const locationAssignMock = jest.fn();

	beforeAll( () => {
		oldLocation = global.location;
		delete global.location;
		global.location = Object.defineProperties(
			{},
			{
				assign: {
					configurable: true,
					value: locationAssignMock,
				},
			}
		);
	} );

	afterAll( () => {
		global.location = oldLocation;
	} );

	beforeEach( () => {
		locationAssignMock.mockReset();
	} );

	// return locationAssignMock;
}
