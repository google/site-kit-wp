<?php
/**
 * Class Google\Site_Kit\Tests\Core\Modules\FakeModule__With_Tags
 *
 * @package   Google\Site_Kit\Tests\Core\Modules
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Core\Modules\Module_With_Tags_Trait;

class FakeModule_With_Tags extends FakeModule {
	use Module_With_Tags_Trait {
		is_tag_blocked as public;
		get_tag_block_on_consent_attribute as public;
		get_tag_amp_block_on_consent_attribute as public;
	}
}
