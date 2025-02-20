// modules/reader-revenue-manager/index.js
import Data from 'googlesitekit-data';
import { registerStore } from '../../assets/js/modules/reader-revenue-manager/datastore';
import { registerReaderRevenueManagerPlugin } from './plugin-registration';

registerStore( Data );

registerReaderRevenueManagerPlugin();
