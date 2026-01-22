import { NOCACHE } from '../constant';

import { SetMetadata } from '@nestjs/common';

export const NoCache = () => SetMetadata(NOCACHE, true);
