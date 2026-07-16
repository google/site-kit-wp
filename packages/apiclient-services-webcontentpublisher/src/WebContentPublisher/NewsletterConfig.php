<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\Webcontentpublisher;

class NewsletterConfig extends \Google\Model
{
  /**
   * Custom consent text shown to the user.
   *
   * @var string
   */
  public $customConsentText;
  /**
   * A custom message displayed in the signup prompt.
   *
   * @var string
   */
  public $customMessage;
  /**
   * Whether the user name is required.
   *
   * @var bool
   */
  public $nameRequired;
  /**
   * The title of the newsletter signup prompt.
   *
   * @var string
   */
  public $title;

  public function setCustomConsentText($customConsentText)
  {
    $this->customConsentText = $customConsentText;
  }
  public function getCustomConsentText()
  {
    return $this->customConsentText;
  }
  public function setCustomMessage($customMessage)
  {
    $this->customMessage = $customMessage;
  }
  public function getCustomMessage()
  {
    return $this->customMessage;
  }
  public function setNameRequired($nameRequired)
  {
    $this->nameRequired = $nameRequired;
  }
  public function getNameRequired()
  {
    return $this->nameRequired;
  }
  public function setTitle($title)
  {
    $this->title = $title;
  }
  public function getTitle()
  {
    return $this->title;
  }
}

class_alias(NewsletterConfig::class, 'Google_Service_Webcontentpublisher_NewsletterConfig');
