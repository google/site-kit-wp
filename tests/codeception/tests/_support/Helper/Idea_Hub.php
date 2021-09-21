<?php

namespace Helper;

// here you can define custom actions
// all public methods declared in helper class will be available in $I

class Idea_Hub extends \Codeception\Module {

	public function enableIdeaHubMocks() {
		$I = $this->getModule( '\Helper\WordPress' );
		$I->activatePlugins(
			'codeception-plugins/idea-hub-mocks.php'
		);
	}

	public function setupIdeaHub() {
		$I = $this->getModule( '\Helper\SiteKit' );
		$I->activateModule(
			'idea-hub',
			array(
				'tosAccepted' => 1,
			)
		);
	}

}
