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

class DomainProperty extends \Google\Model
{
  /**
   * Whether domain ownership has been verified.
   *
   * @var bool
   */
  public $ownershipVerified;
  /**
   * The URL of the domain property.
   *
   * @var string
   */
  public $url;

  /**
   * @param bool $ownershipVerified
   */
  public function setOwnershipVerified($ownershipVerified)
  {
    $this->ownershipVerified = $ownershipVerified;
  }
  /**
   * @return bool
   */
  public function getOwnershipVerified()
  {
    return $this->ownershipVerified;
  }
  /**
   * @param string $url
   */
  public function setUrl($url)
  {
    $this->url = $url;
  }
  /**
   * @return string
   */
  public function getUrl()
  {
    return $this->url;
  }
}

class_alias(DomainProperty::class, 'Google_Service_Webcontentpublisher_DomainProperty');
