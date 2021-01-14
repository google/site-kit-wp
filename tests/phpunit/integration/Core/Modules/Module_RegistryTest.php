<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\Module_RegistryTest
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_Registry;
use Google\Site_Kit\Tests\TestCase;

class Module_RegistryTest extends TestCase {

	/**
	 * @dataProvider data_register
	 *
	 * @param $classname
	 * @param $expected_exception
	 */
	public function test_register( $classname, $expected_exception ) {
		$registry = new Module_Registry();
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
		$exception_no_classname     = 'A module class name is required to register a module.';
		$exception_not_extends_base = 'All module classes must extend the base module class: ' . Module::class;

		return array(
			'no class name'                     => array( '', $exception_no_classname ),
			'non-existent class name'           => array( '\\Foo\\Bar', "No class exists for '\\Foo\\Bar'" ),
			'existing class not-extending base' => array( __CLASS__, $exception_not_extends_base ),
		);
	}

	public function test_get_all() {
		$registry = new Module_Registry();

		$this->assertEquals( array(), $registry->get_all() );

		$registry->register( FakeModule::class );
		$this->assertEquals( array( FakeModule::class ), $registry->get_all() );

		// Registering the same module again does not result in a duplicate entry.
		$registry->register( FakeModule::class );
		$this->assertEquals( array( FakeModule::class ), $registry->get_all() );

		$mock_module       = $this->getMockBuilder( FakeModule::class )
								->disableOriginalConstructor()
								->setMethods( array( 'foo' ) ) // required to prevent ReflectionType::__toString() deprecation error
								->getMock();
		$mock_module_class = get_class( $mock_module );

		$registry->register( $mock_module_class );
		$this->assertEqualSets(
			array(
				FakeModule::class,
				$mock_module_class,
			),
			$registry->get_all()
		);
	}
}
