<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Idea_Hub\Idea_Interaction_CountTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Idea_Hub
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Idea_Hub;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Idea_Hub\Idea_Interaction_Count;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Idea_Hub
 */
class Idea_Interaction_CountTest extends TestCase {

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * @var Idea_Interaction_Count
	 */
	private $interaction_count;

	/**
	 * @before
	 */
	public function beforeEach() {
		parent::beforeEach();

		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_options      = new User_Options( $context, $user_id );
		$this->interaction_count = new Idea_Interaction_Count( $this->user_options );
		$this->interaction_count->register();
	}

	public function test_increment() {
		$this->user_options->set( Idea_Interaction_Count::OPTION, 10 );
		$this->interaction_count->increment();
		$this->assertEquals( 11, $this->interaction_count->get() );
	}

	public function test_increment__default_value() {
		$this->interaction_count->increment();
		$this->assertEquals( 1, $this->interaction_count->get() );
	}

}
