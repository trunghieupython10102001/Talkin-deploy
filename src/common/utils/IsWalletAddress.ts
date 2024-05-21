import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const IsWalletAddress = createParamDecorator(
  (data: { address: string }, ctx: ExecutionContext) => {},
);
