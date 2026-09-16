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

class SlProduct extends \Google\Model
{
  /**
   * Whether subscription linking is enabled.
   *
   * @var bool
   */
  public $enabled;
  /**
   * The Google Cloud project number associated with the publication.
   *
   * @var string
   */
  public $gcpProjectNumber;

  /**
   * @param bool $enabled
   */
  public function setEnabled($enabled)
  {
    $this->enabled = $enabled;
  }
  /**
   * @return bool
   */
  public function getEnabled()
  {
    return $this->enabled;
  }
  /**
   * @param string $gcpProjectNumber
   */
  public function setGcpProjectNumber($gcpProjectNumber)
  {
    $this->gcpProjectNumber = $gcpProjectNumber;
  }
  /**
   * @return string
   */
  public function getGcpProjectNumber()
  {
    return $this->gcpProjectNumber;
  }
}

class_alias(SlProduct::class, 'Google_Service_Webcontentpublisher_SlProduct');
