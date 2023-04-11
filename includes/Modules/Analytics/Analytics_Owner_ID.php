<?php

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Core\Storage\Setting;

class Analytics_Owner_ID extends Setting {

	const OPTION = 'googlesitekit_analytics_owner_id';

	protected function get_type() {
		return 'integer';
	}

	protected function get_default() {
		return 0;
	}
}
