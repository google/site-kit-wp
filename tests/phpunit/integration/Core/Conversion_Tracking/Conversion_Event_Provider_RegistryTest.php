<?php
/**
 * Class Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Provider_RegistryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Conversion_Tracking
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Conversion_Tracking;

use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Provider_Registry;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeConversionEventProvider;
use Google\Site_Kit\Tests\TestCase;

class Conversion_Event_Provider_RegistryTest extends TestCase {

	/**
	 * @dataProvider data_register
	 *
	 * @param $classname
	 * @param $expected_exception
	 */
	public function test_register( $classname, $expected_exception ) {
		$registry = new Conversion_Event_Provider_Registry();
		try {
			$registry->register( $classname );
		} catch ( \Exception $exception ) {
			if ( ! $expected_exception ) {
				$this->fail( 'No exception expected but a ' . get_class( $exception ) . ' was thrown' );
			}
			$this->assertEquals( $expected_exception, $exception->getMessage() );
		}
	}

	public function data_register() {
		$exception_no_classname     = 'A conversion event provider class name is required to instantiate a conversion event provider.';
		$exception_not_extends_base = 'All conversion event provider classes must extend the base conversion event provider class: ' . Conversion_Events_Provider::class;

		return array(
			'no class name'                     => array( '', $exception_no_classname ),
			'non-existent class name'           => array( '\\Foo\\Bar', "No class exists for '\\Foo\\Bar'" ),
			'existing class not-extending base' => array( __CLASS__, $exception_not_extends_base ),
		);
	}

	public function test_get_all() {
		$registry = new Conversion_Event_Provider_Registry();

		$this->assertEquals( array(), $registry->get_all() );

		$registry->register( FakeConversionEventProvider::class );
		$this->assertEquals( array( FakeConversionEventProvider::class ), $registry->get_all() );

		// Registering the same conversion event provider again does not result in a duplicate entry.
		$registry->register( FakeConversionEventProvider::class );
		$this->assertEquals( array( FakeConversionEventProvider::class ), $registry->get_all() );

		$mock_conversion_event_provider       = $this->getMockBuilder( FakeConversionEventProvider::class )
								->disableOriginalConstructor()
								->setMethods( array( 'foo' ) ) // required to prevent ReflectionType::__toString() deprecation error
								->getMock();
		$mock_conversion_event_provider_class = get_class( $mock_conversion_event_provider );

		$registry->register( $mock_conversion_event_provider_class );
		$this->assertEqualSets(
			array(
				FakeConversionEventProvider::class,
				$mock_conversion_event_provider_class,
			),
			$registry->get_all()
		);
	}
}
