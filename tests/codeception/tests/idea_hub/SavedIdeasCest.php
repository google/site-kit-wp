<?php

use Step\Idea_Hub\Widget as Widget_Tester;

class SavedIdeasCest {

	public function _before( Idea_HubTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$this->ideas = include __DIR__ . '/../../plugins/idea-hub/saved-ideas.php';

		$I->loginAsAdmin();
		$I->enableIdeaHubMocks();
		$I->connectSiteKit();
		$I->setupIdeaHub();
	}

	public function canSeeSavedIdeas() {

	}

}
