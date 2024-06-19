<?php
/**
 * Reader_Revenue_ManagerTest
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class Reader_Revenue_ManagerTest extends TestCase {
    /**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Reader_Revenue_Manager object.
	 *
	 * @var Reader_Revenue_Manager
	 */
	private $reader_revenue_manager;

    public function set_up() {
		parent::set_up();

		$this->context           = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->reader_revenue_manager = new Reader_Revenue_Manager( $this->context );
	}

	public function test_magic_methods() {
		$this->assertEquals( 'reader-revenue-manager', $this->reader_revenue_manager->slug );
		$this->assertEquals( 'Reader Revenue Manager', $this->reader_revenue_manager->name );
		$this->assertEquals( 'https://readerrevenue.withgoogle.com/', $this->reader_revenue_manager->homepage );
        $this->assertEquals( 'Reader Revenue Manager helps publishers grow, retain, and engage their audiences, creating new revenue opportunities', $this->reader_revenue_manager->description );
		$this->assertEquals( 5, $this->reader_revenue_manager->order );
	}

	public function test_get_scopes() {
		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/subscribewithgoogle.publications.readonly',
			),
			$this->reader_revenue_manager->get_scopes()
		);
	}
}
